import type { ObjectLiteral, AssemblerContext } from 'assemblerjs';
import { createConstructorDecorator } from 'assemblerjs';
import { ControllerService } from '@/controller/controller.service';
import {
  buildOwnPath,
  forceSingleton,
  propagatePathToInjections,
} from './controller.decorator.helpers';

export interface ControllerDefinition extends ObjectLiteral {
  path: string | RegExp;
}

/**
 * The `Controller` decorator defines a controller class in the REST framework.
 * It sets up the controller's path, enforces singleton instantiation, and
 * monkey-patches `onInited` to register routes with the global adapter.
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
 * Monkey-patches `onInited` to register routes and propagate the path to
 * injected sub-controllers.
 */
const wrapOnInited = (target: any): void => {
  const oldInited = target.onInited?.bind(target);

  const wrappedInited = function (
    context: AssemblerContext,
    configuration: any
  ) {
    ControllerService.buildRoutesHandlers(target);
    propagatePathToInjections(target, context);

    if (oldInited) oldInited.call(target, context, configuration);
  };

  target.onInited = wrappedInited;
};
