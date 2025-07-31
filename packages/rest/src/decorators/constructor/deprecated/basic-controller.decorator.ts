import type { AssemblerContext } from 'assemblerjs';
import {
  createConstructorDecorator,
  getAssemblageDefinition,
} from 'assemblerjs';
import { WebFrameworkAdapter } from '@/adapters/adapter.abstract';
import { cleanPath } from '@/controller/clean-path';
import { ControllerPrivateKeys } from '../controller.keys';
import type { ControllerDefinition } from '../controller.decorator';
import { RouteMetadata } from '@/metadata/metadata.types';

/*
 * The `Controller` decorator is used to define a controller class in the REST framework.
 * It sets up the controller's path and ensures it is a singleton.
 * It also wraps the `onInited` method to register routes with the global adapter.
 *
 * @deprecated Use `Controller` instead.
 */
export const BasicController = createConstructorDecorator(function (
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
  const wrappedInited = function (context: AssemblerContext) {
    const globalAdapterIdentifier =
      context.global('@assemblerjs/rest')?.adapter || WebFrameworkAdapter;

    if (context.has(globalAdapterIdentifier)) {
      const adapter: WebFrameworkAdapter = context.require(
        globalAdapterIdentifier
      );
      //
      const routes: RouteMetadata[] =
        Reflect.getMetadata(ControllerPrivateKeys.Routes, target.constructor) ||
        [];

      const middlewares: any[] =
        Reflect.getMetadata(
          ControllerPrivateKeys.BeforeMiddlewares,
          target.constructor
        ) || [];

      for (const route of routes) {
        // Check if the route has a middleware defined for it.
        const middlewareForMethod = middlewares.find(
          (middleware) => middleware.handlerName === route.handlerName
        );

        if (middlewareForMethod) {
          // If a middleware is defined for this route, add it.
          adapter.app[route.method](
            `${target.path}/${route.path}`,
            middlewareForMethod.middleware.bind(target)
          );
        }

        // TODO: Works with Express, what with other frameworks.
        adapter.app[route.method](
          `${target.path}/${route.path}`,
          target[route.handlerName].bind(target)
        );
      }
    } else {
      throw new Error(
        `No injection was found for the adapter ('${globalAdapterIdentifier.name}') provided in assemblage's configuration. '${target.constructor.name}' must be configured manually.`
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
