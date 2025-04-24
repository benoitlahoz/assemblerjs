import type { ObjectLiteral, AssemblerContext } from 'assemblerjs';
import {
  createConstructorDecorator,
  getAssemblageDefinition,
} from 'assemblerjs';
import { WebFrameworkAdapter } from '@/adapters/adapter.abstract';
import { cleanPath } from '@/common/helpers';
import { RouteDefinition } from '../methods/types';
import { ControllerPrivateKeys } from '../methods/controller.keys';

export interface ControllerDefinition extends ObjectLiteral {
  path: string | RegExp;
}

export const Controller = createConstructorDecorator(function (
  this: any,
  definition?: ControllerDefinition
) {
  buildOwnPath(this, definition);
  forceSingleton(this);
  wrapOnInited(this);
});

/**
 * Builds a `Controller` own path (before it is changed to the whole tree path) according to the definition.
 *
 * @param { any } target The controller to build own path of.
 * @param { ControllerDefinition | undefined } definition The definition passed to the `Controller` decorator.
 */
const buildOwnPath = (target: any, definition?: ControllerDefinition) => {
  // Clean and assign the path for the controller.

  target.path = definition?.path
    ? typeof definition.path === 'string'
      ? cleanPath(definition.path)
      : definition.path
    : '';
};

/**
 * Force an assemblage to be a singleton.
 *
 * @param { any } target The assemblage to force to be a singleton.
 */
const forceSingleton = (target: any) => {
  const assemblageDefinition = getAssemblageDefinition(target.constructor);
  assemblageDefinition.singleton = true as any;
};

/**
 * Monkey patch the `onInited` method of target assemblage instance to build full path of a 'main' `Controller and its dependencies.
 *
 * @param { any } target The assemblage instance.
 */
const wrapOnInited = (target: any) => {
  const oldInited = target.onInited?.bind(target);
  const wrappedInited = function (context: AssemblerContext) {
    if (context.has(WebFrameworkAdapter)) {
      const adapter: WebFrameworkAdapter = context.require(WebFrameworkAdapter);
      //
      const routes: RouteDefinition[] =
        Reflect.getMetadata(ControllerPrivateKeys.Routes, target.constructor) ||
        [];
      // console.log(routes, target.path);
      for (const route of routes) {
        // TODO: Works with Express, what with other frameworks.
        adapter.app[route.method](
          `${target.path}/${route.path}`,
          target[route.handlerName].bind(target)
        );
      }
    } else {
      console.warn(
        `No injection was found for key 'WebFrameworkAdapter'. '${target.constructor.name}' must be configured manually.`
      );
    }

    // Get assemblage injections.
    const injected = getAssemblageDefinition(target.constructor).inject || [];

    for (const injection of injected) {
      const injectedSingleton: any = context.require(injection[0]);
      injectedSingleton.path = `${target.path}${injectedSingleton.path}`;

      // sealPath(injectedSingleton);
    }

    // sealPath(target);

    if (oldInited) oldInited();
  };

  target.onInited = wrappedInited;
};
