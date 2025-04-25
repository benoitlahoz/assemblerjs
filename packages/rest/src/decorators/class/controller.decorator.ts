import type { ObjectLiteral, AssemblerContext } from 'assemblerjs';
import { AbstractAssemblage } from 'assemblerjs';
import {
  createConstructorDecorator,
  getAssemblageDefinition,
} from 'assemblerjs';
import { FrameworkAdapter } from '@/adapters/adapter.abstract';
import { cleanPath } from '@/common/helpers';
import { RouteDefinition } from '../methods/types';
import { ControllerPrivateKeys } from '../methods/controller.keys';

export interface ControllerDefinition extends ObjectLiteral {
  path: string | RegExp;
}

export abstract class AbstractController extends AbstractAssemblage {
  public abstract path: string | RegExp;
}

export const Controller = createConstructorDecorator(function (
  this: AbstractController,
  definition?: ControllerDefinition
) {
  buildOwnPath(this, definition);
  forceSingleton(this);
  wrapOnInited(this);
});

/**
 * Builds a `Controller` own path (before it is changed to the whole tree path) according to the definition.
 *
 * @param { T extends AbstractController } target The controller to build own path of.
 * @param { ControllerDefinition | undefined } definition The definition passed to the `Controller` decorator.
 */
const buildOwnPath = <T extends AbstractController>(
  target: T,
  definition?: ControllerDefinition
) => {
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
 * @param { T extends AbstractController } target The assemblage to force to be a singleton.
 */
const forceSingleton = <T extends AbstractController>(target: T) => {
  const assemblageDefinition = getAssemblageDefinition<T>(
    target.constructor as any
  );
  assemblageDefinition.singleton = true as any;
};

/**
 * Monkey patch the `onInited` method of target assemblage instance to build full path of a 'main' `Controller and its dependencies.
 *
 * @param { T extends AbstractController } target The assemblage instance.
 */
const wrapOnInited = <T extends AbstractController>(target: T) => {
  const oldInited = target.onInited?.bind(target);
  const wrappedInited = function (
    context: AssemblerContext,
    configuration: any
  ) {
    if (context.has(FrameworkAdapter)) {
      const adapter: FrameworkAdapter = context.require(FrameworkAdapter);

      const routes: RouteDefinition[] =
        Reflect.getMetadata(ControllerPrivateKeys.Routes, target.constructor) ||
        [];

      for (const route of routes) {
        adapter.app[route.method](
          `${target.path}/${route.path}`,
          target[String(route.handlerName)].bind(target)
        );
      }
    } else {
      console.warn(
        `No injection was found for key 'FrameworkAdapter'. '${target.constructor.name}' must be configured manually.`
      );
    }

    // Get assemblage injections.
    const injected =
      getAssemblageDefinition(target.constructor as any).inject || [];

    for (const injection of injected) {
      const injectedSingleton: any = context.require(injection[0]);
      injectedSingleton.path = `${target.path}${injectedSingleton.path}`;
    }

    if (oldInited) oldInited(context, configuration);
  };

  target.onInited = wrappedInited;
};
