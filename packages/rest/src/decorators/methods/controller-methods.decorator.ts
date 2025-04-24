import type { RouteDefinition } from './types';
import { RouteMethods } from './types';
import { ControllerPrivateKeys } from './controller.keys';
import { cleanPath } from '@/common/helpers';

// https://javascript.plainenglish.io/how-to-write-simple-router-decorators-for-expressjs-with-typescript-3b8340b4d453
const methodDecoratorFactory = (method: RouteMethods) => {
  return (path: string, info?: string, type = '*/*'): MethodDecorator => {
    return (target, propertyKey) => {
      const controllerClass = target.constructor;

      const routes: RouteDefinition[] = Reflect.hasMetadata(
        ControllerPrivateKeys.Routes,
        controllerClass
      )
        ? Reflect.getMetadata(ControllerPrivateKeys.Routes, controllerClass)
        : [];

      const routePath = cleanPath(path, 'remove');

      routes.push({
        method,
        path: routePath,
        handlerName: propertyKey,
        info: info || '',
        type,
      });

      Reflect.defineMetadata(
        ControllerPrivateKeys.Routes,
        routes,
        controllerClass
      );
    };
  };
};

export const All = methodDecoratorFactory(RouteMethods.All);
export const Get = methodDecoratorFactory(RouteMethods.Get);
export const Post = methodDecoratorFactory(RouteMethods.Post);
export const Put = methodDecoratorFactory(RouteMethods.Put);
export const Delete = methodDecoratorFactory(RouteMethods.Delete);
export const Patch = methodDecoratorFactory(RouteMethods.Patch);

// https://stackoverflow.com/questions/29954037/why-is-an-options-request-sent-and-can-i-disable-it
export const Options = methodDecoratorFactory(RouteMethods.Options);
export const Head = methodDecoratorFactory(RouteMethods.Head);
export const Trace = methodDecoratorFactory(RouteMethods.Trace);
export const Connect = methodDecoratorFactory(RouteMethods.Connect);
