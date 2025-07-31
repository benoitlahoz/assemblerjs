import type { ObjectLiteral, AssemblerContext } from 'assemblerjs';
import {
  createConstructorDecorator,
  getAssemblageDefinition,
} from 'assemblerjs';
import { cleanPath } from '@/controller/clean-path';
import { ControllerService } from '@/controller/controller.service';

export interface ControllerDefinition extends ObjectLiteral {
  path: string | RegExp;
}

/**
 * The `Controller` decorator is used to define a controller class in the REST framework.
 * It sets up the controller's path and ensures it is a singleton.
 * It also wraps the `onInited` method to register routes with the global adapter.
 */
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
    : '/';
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

  const wrappedInited = function (
    context: AssemblerContext,
    configuration: any
  ) {
    // Build routes handlers for the controller.
    ControllerService.buildRoutesHandlers(target);

    // Get assemblage injections.
    const injected = getAssemblageDefinition(target.constructor).inject || [];
    for (const injection of injected) {
      const injectable = injection[0];
      const injectedSingleton: any = context.require(injectable);
      // Set injected path with injector's one (meaning we can nest controllers injections without passing the full path).
      injectedSingleton.path = `${target.path}${injectedSingleton.path}`;
    }

    if (oldInited) oldInited.call(target, context, configuration);
  };

  target.onInited = wrappedInited;
};
