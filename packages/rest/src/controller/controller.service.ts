import { getAssemblageContext } from 'assemblerjs';
import { DtoValidationError } from '@assemblerjs/dto';
import type { NextFunction, Request, Response } from 'express';
import { WebFrameworkAdapter } from '@/adapters';
import type {
  HttpStatusMetadata,
  RedirectMetadata,
  RouteMetadata,
} from '@/metadata/metadata.types';
import { MetadataStorage } from '@/metadata/metadata-storage';
import {
  DefaultCreatedStatus,
  DefaultNoContentStatus,
  DefaultRedirectStatus,
  DefaultSuccessStatus,
} from './constants';
import { RouteMethods } from '@/decorators/methods';
import { parseParametersDecorators } from './parse-parameters';
import { DecoratedParameterPrivateKeys } from '@/decorators/parameters/parameters-decorators.keys';
import { GenericError } from '@/errors';

export const GlobalAssemblageAdapterIdentifier = '@assemblerjs/rest';

class _ControllerService {
  public getAdapter(target: Function): WebFrameworkAdapter {
    const context = this.getContext(target);

    const globalAdapterIdentifier =
      context.global(GlobalAssemblageAdapterIdentifier)?.adapter ||
      WebFrameworkAdapter;

    if (!context.has(globalAdapterIdentifier)) {
      throw new Error(`Adapter not found: ${globalAdapterIdentifier}`);
    }

    const adapter: WebFrameworkAdapter = context.require(
      globalAdapterIdentifier
    );
    return adapter;
  }

  public getRoutes(target: Function): RouteMetadata[] {
    return MetadataStorage.getRoutes(target);
  }

  public buildRoutesHandlers(target: Function) {
    const routes: RouteMetadata[] = MetadataStorage.getRoutes(target);

    for (const route of routes) {
      const { method, path, handlerName } = route;
      // Register the route with the adapter.
      const adapter = this.getAdapter(target);
      const app = adapter.app;

      if (typeof app[method] !== 'function') {
        throw new Error(`Method ${method} is not supported by the adapter.`);
      }

      const beforeMiddlewares = MetadataStorage.getBeforeMiddlewaresForHandler(
        target,
        handlerName
      );
      // Execute before middlewares.
      for (const middleware of beforeMiddlewares) {
        app.use(middleware.function);
      }

      const handler = this.getRequestHandler(target, route);

      // Register the route with the adapter.
      // The path is prefixed with the controller's path.
      app[method](
        `${(target as any).path || ''}/${path}`,
        handler.bind(target)
      );
    }
  }

  public getRequestHandler(target: Function, route: RouteMetadata): Function {
    const { handlerName } = route;

    return async function (req: Request, res: Response, next: NextFunction) {
      try {
        if ((req as any).routeProcessed) {
          next();
        }

        if (!(req as any).routeProcessed) {
          // If the request has not been processed yet, we start the action processing.
          // This is to prevent multiple executions of the same route.
          // For example for Head and Get requests, or when multiple routes match the request.
          // see: https://expressjs.com/en/4x/api.html#router.METHOD
          (req as any).routeProcessed = true;
        }

        const redirect = MetadataStorage.getRedirectForHandler(
          target,
          handlerName
        );

        const afterMiddlewares = MetadataStorage.getAfterMiddlewaresForHandler(
          target,
          handlerName
        );
        const hasResponseDecorator = MetadataStorage.hasParameter(
          DecoratedParameterPrivateKeys.Response,
          target,
          handlerName
        );

        // Set headers if defined.
        const headers = ControllerService.getHeaders(target, handlerName);
        if (headers) {
          for (const [key, value] of Object.entries(headers)) {
            res.setHeader(key, value);
          }
        }

        // Build arguments for the controller method.
        const args: any[] = await parseParametersDecorators(
          [],
          target,
          handlerName,
          req,
          res,
          next
        );

        // Call the controller method.
        const result = await (target as any)[String(handlerName)](...args);

        // Handle `after` middlewares
        // We use res.on('finish') to ensure that the after middlewares are executed after the response is sent.
        // Result of the called method is passed to the after middlewares.
        res.on('finish', () => {
          function after(result: any) {
            afterMiddlewares.forEach((middleware) => {
              return middleware.function(result, req, res);
            });
          }
          after(result);
        });

        if (hasResponseDecorator) {
          // If the method has a response decorator, we don't handle the response here.
          return;
        }

        // If a redirection is defined for this route, handle it.
        if (
          ControllerService.handleRedirect(target, route, redirect, result, res)
        ) {
          return;
        }

        if (!result) {
          // If the method returns undefined or null and does not have a response decorator,
          // we return a 204 No Content status.
          res.status(DefaultNoContentStatus).end();
          return;
        }

        // Handle success response.
        return ControllerService.handleSuccessResponse(
          route,
          target,
          res,
          result
        );
      } catch (error) {
        return ControllerService.handleErrorResponse(error, res, next);
      }
    };
  }

  private getContext(target: Function) {
    const context = getAssemblageContext(target.constructor);

    if (!context) {
      throw new Error(
        `ControllerService: No AssemblerContext found for target ${target.constructor}`
      );
    }
    return context;
  }

  private getStatus(
    method: RouteMethods,
    httpStatus: HttpStatusMetadata | undefined,
    result: any,
    redirect?: RedirectMetadata | undefined
  ): number {
    if (httpStatus) {
      return httpStatus.status;
    }
    if (redirect) {
      return DefaultRedirectStatus;
    }
    return result
      ? method.toLowerCase() === 'post'
        ? DefaultCreatedStatus
        : DefaultSuccessStatus
      : DefaultNoContentStatus;
  }

  private getHeaders(
    controller: any,
    handlerName: string | symbol
  ): Record<string, string> | undefined {
    return MetadataStorage.getHttpHeadersForHandler(controller, handlerName);
  }

  private handleRedirect(
    target: any,
    route: RouteMetadata,
    redirect: RedirectMetadata | undefined,
    result: any,
    res: Response
  ): boolean {
    const targetPath = (target as any).path || '';
    const { method, handlerName } = route;
    const httpStatus = MetadataStorage.getHttpStatusForHandler(
      target,
      handlerName
    );

    const status = ControllerService.getStatus(
      method as RouteMethods,
      httpStatus,
      result,
      redirect
    );
    // If a redirection is defined for this route, handle it.
    if (!redirect) {
      // If no redirect is defined, we return false to indicate that no redirection was handled.
      return false;
    }

    let finalLocation: string | undefined;

    switch (typeof result) {
      case 'string':
        finalLocation = result;
        break;
      case 'object':
        if (redirect.location && redirect.location.includes(':')) {
          finalLocation = redirect.location.replace(/:(\w+)/g, (match, p1) => {
            return result[p1] !== undefined ? String(result[p1]) : match;
          });
        } else {
          finalLocation = redirect.location;
        }
        break;
      default:
        finalLocation = redirect.location;
        break;
    }

    if (!finalLocation) {
      // fallback: redirect to root if location is not resolved
      finalLocation = '/';
    }

    res.redirect(status, `${targetPath}${finalLocation}`);

    return true; // Indicate that a redirection was handled.
  }

  public handleSuccessResponse(
    route: RouteMetadata,
    target: Function,
    res: Response,
    result: any
  ): void {
    const { method, handlerName } = route;
    const httpStatus = MetadataStorage.getHttpStatusForHandler(
      target,
      handlerName
    );

    // Set status code.
    // If a redirection is defined for this route, handle it.
    const status = ControllerService.getStatus(
      method as RouteMethods,
      httpStatus,
      result
    );

    if (result instanceof GenericError) {
      res.status(result.status).json({ error: result.message });
    } else if (Buffer.isBuffer(result)) {
      res.status(status).send(result);
    } else if (typeof result === 'string') {
      res.status(status).send(result);
    } else if (result === undefined || result === null) {
      res.sendStatus(status); // No Content
    } else if (Array.isArray(result)) {
      res.status(status).json(result);
    } else if (result instanceof ArrayBuffer) {
      res.status(status).send(Buffer.from(result));
    } else if (result.pipe && typeof result.pipe === 'function') {
      // Handle streams
      result.pipe(res);
    } else if (typeof result === 'object' && result !== null) {
      // If the result is an object, send it as JSON.
      res.status(status).json(result);
    } else {
      res.status(status).send(result);
    }
  }

  public handleErrorResponse(
    error: any,
    res: Response,
    next: NextFunction
  ): void {
    // Handle error response.
    if (error instanceof GenericError || error instanceof DtoValidationError) {
      res
        .status(error.status)
        .json({ status: error.status, message: error.message });
    } else {
      next(error);
    }
  }
}

export const ControllerService = new _ControllerService();
