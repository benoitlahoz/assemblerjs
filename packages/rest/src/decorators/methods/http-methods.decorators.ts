import { RouteMethods } from './http-methods.types';
import { cleanPath } from '@/controller/clean-path';
import { MetadataStorage } from '@/metadata/metadata-storage';

// https://javascript.plainenglish.io/how-to-write-simple-router-decorators-for-expressjs-with-typescript-3b8340b4d453
const httpMethodDecoratorFactory = (method: RouteMethods) => {
  return (path: string, info?: string): MethodDecorator => {
    return (target, propertyKey) => {
      MetadataStorage.addRoute(
        target,
        method,
        cleanPath(path, 'remove'),
        propertyKey,
        info || ''
      );
    };
  };
};

export const All = httpMethodDecoratorFactory(RouteMethods.All);
export const Get = httpMethodDecoratorFactory(RouteMethods.Get);
export const Post = httpMethodDecoratorFactory(RouteMethods.Post);
export const Put = httpMethodDecoratorFactory(RouteMethods.Put);
export const Delete = httpMethodDecoratorFactory(RouteMethods.Delete);
export const Patch = httpMethodDecoratorFactory(RouteMethods.Patch);

// https://stackoverflow.com/questions/29954037/why-is-an-options-request-sent-and-can-i-disable-it
export const Options = httpMethodDecoratorFactory(RouteMethods.Options);
export const Head = httpMethodDecoratorFactory(RouteMethods.Head);
export const Trace = httpMethodDecoratorFactory(RouteMethods.Trace);
export const Connect = httpMethodDecoratorFactory(RouteMethods.Connect);
