import type { AssemblerContext } from 'assemblerjs';
import { createConstructorDecorator } from 'assemblerjs';
import { AbstractHttpAdapter } from '@/adapters/adapter.abstract';
import { cleanPath } from '@/controller/clean-path';
import { ControllerPrivateKeys } from '../controller.keys';
import type { ControllerDefinition } from '../controller.decorator';
import type { RouteMetadata } from '@/metadata/metadata.types';
import {
  buildOwnPath,
  forceSingleton,
  propagatePathToInjections,
} from '../controller.decorator.helpers';

/*
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

const wrapOnInited = (target: any) => {
  const oldInited = target.onInited?.bind(target);

  const wrappedInited = function (context: AssemblerContext) {
    const globalAdapterIdentifier =
      context.global('@assemblerjs/rest')?.adapter || AbstractHttpAdapter;

    if (!context.has(globalAdapterIdentifier)) {
      throw new Error(
        `No injection was found for the adapter ('${(globalAdapterIdentifier as any).name}') provided in assemblage's configuration. '${target.constructor.name}' must be configured manually.`
      );
    }

    const adapter: AbstractHttpAdapter = context.require(
      globalAdapterIdentifier
    );

    const routes: RouteMetadata[] =
      Reflect.getMetadata(ControllerPrivateKeys.Routes, target.constructor) ||
      [];

    const middlewares: any[] =
      Reflect.getMetadata(
        ControllerPrivateKeys.BeforeMiddlewares,
        target.constructor
      ) || [];

    for (const route of routes) {
      const scopedMiddlewares = middlewares
        .filter((m) => m.handlerName === route.handlerName)
        .map((m) => m.function.bind(target));

      const fullPath = cleanPath(`${target.path}/${route.path}`);

      adapter.registerRoute(
        route.method,
        fullPath,
        scopedMiddlewares,
        target[route.handlerName].bind(target)
      );
    }

    propagatePathToInjections(target, context);

    if (oldInited) oldInited();
  };

  target.onInited = wrappedInited;
};
