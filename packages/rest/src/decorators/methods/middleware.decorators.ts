import type { NextFunction, Request, Response } from 'express';
import { MetadataStorage } from '@/metadata/metadata-storage';

export const Middleware = (
  middleware:
    | ((
        req: Request,
        res: Response,
        next: NextFunction
      ) => void | Promise<void>)
    | ((result: any, req: Request, res: Response) => void | Promise<void>),
  type: 'before' | 'after' = 'before'
): MethodDecorator => {
  return (target, propertyKey) => {
    if (type === 'after') {
      MetadataStorage.addAfterMiddleware(target, propertyKey, middleware);
    } else {
      MetadataStorage.addBeforeMiddleware(target, propertyKey, middleware);
    }
  };
};

export const BeforeMiddleware = (
  middleware: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => void | Promise<void>
): MethodDecorator => {
  return (target, propertyKey) => {
    MetadataStorage.addBeforeMiddleware(target, propertyKey, middleware);
  };
};

export const AfterMiddleware = (
  middleware: (result: any, req: Request, res: Response) => void | Promise<void>
): MethodDecorator => {
  return (target, propertyKey) => {
    MetadataStorage.addAfterMiddleware(target, propertyKey, middleware);
  };
};
