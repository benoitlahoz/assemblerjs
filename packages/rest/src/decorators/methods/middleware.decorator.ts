import type { NextFunction, Request, Response } from 'express';
import { ControllerPrivateKeys } from './controller.keys';

export const Middleware = (
  middleware: (
    req: Request,
    res: Response,
    next?: NextFunction
  ) => void | Promise<void>
): MethodDecorator => {
  return (target, propertyKey) => {
    const controllerClass = target.constructor;

    // Get existing middlewares or initialize an empty array
    const middlewares: any[] = Reflect.hasMetadata(
      ControllerPrivateKeys.Middlewares,
      controllerClass
    )
      ? Reflect.getMetadata(ControllerPrivateKeys.Middlewares, controllerClass)
      : [];

    // Add the new middleware to the list
    middlewares.push({
      handlerName: propertyKey,
      middleware,
    });

    // Define the updated middlewares metadata
    Reflect.defineMetadata(
      ControllerPrivateKeys.Middlewares,
      middlewares,
      controllerClass
    );
  };
};
