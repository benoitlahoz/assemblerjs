import { getAssemblageContext } from 'assemblerjs';
import { DtoValidationError } from '@assemblerjs/dto';
import { AbstractHttpAdapter, HTTP_ADAPTER_TAG } from '@/adapters';
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
import { cleanPath } from './clean-path';
import type {
  HttpMiddleware,
  HttpNextFunction,
  HttpRequest,
  HttpResponse,
} from '@/http.types';
import type { ResponseSerializer } from '@/serializers/response-serializer.interface';
import { defaultSerializers } from '@/serializers/default-serializers';

export class ControllerServiceImpl {
  private readonly serializers: ResponseSerializer[] = [...defaultSerializers];

  /**
   * Register a custom response serializer.
   * Custom serializers are checked first, before the defaults.
   */
  public addSerializer(serializer: ResponseSerializer): void {
    this.serializers.unshift(serializer);
  }

  public getAdapter(target: Function): AbstractHttpAdapter {
    const context = this.getContext(target);
    const adapters = context.tagged(HTTP_ADAPTER_TAG) as AbstractHttpAdapter[];

    if (adapters.length === 0) {
      throw new Error(
        '[assemblerjs/rest] No HTTP adapter found. ' +
          'Add @HttpAdapter() to your adapter class and register it in provide.'
      );
    }

    return adapters[0];
  }

  public getRoutes(target: Function): RouteMetadata[] {
    return MetadataStorage.getRoutes(target);
  }

  public buildRoutesHandlers(target: Function) {
    const routes: RouteMetadata[] = MetadataStorage.getRoutes(target);
    const adapter = this.getAdapter(target);

    for (const route of routes) {
      const { method, path, handlerName } = route;

      // Warn when @Redirect and @HttpStatus both decorate the same handler.
      // @Redirect takes precedence for the HTTP status code.
      const redirect = MetadataStorage.getRedirectForHandler(target, handlerName);
      const httpStatus = MetadataStorage.getHttpStatusForHandler(target, handlerName);
      if (redirect && httpStatus) {
        console.warn(
          `[assemblerjs/rest] Handler '${String(handlerName)}' has both ` +
            `@Redirect and @HttpStatus. @Redirect takes precedence for the ` +
            `HTTP status code.`
        );
      }

      // Collect before-middlewares scoped to this route only.
      const beforeMiddlewares = MetadataStorage.getBeforeMiddlewaresForHandler(
        target,
        handlerName
      );
      const scopedMiddlewares: HttpMiddleware[] = beforeMiddlewares.map(
        (m) => m.function as HttpMiddleware
      );

      const handler = this.getRequestHandler(target, route);

      // Normalise the full path to avoid double slashes.
      const fullPath = cleanPath(`${(target as any).path || ''}/${path}`);

      adapter.registerRoute(
        method,
        fullPath,
        scopedMiddlewares,
        handler as (
          req: HttpRequest,
          res: HttpResponse,
          next: HttpNextFunction
        ) => Promise<void>
      );
    }
  }

  public getRequestHandler(target: Function, route: RouteMetadata): Function {
    const { handlerName } = route;

    return async (req: HttpRequest, res: HttpResponse, next: HttpNextFunction) => {
      try {
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

        // Set response headers defined via @HttpHeaders.
        const headers = ControllerService.getHeaders(target, handlerName);
        if (headers) {
          for (const [key, value] of Object.entries(headers)) {
            res.setHeader(key, value);
          }
        }

        // Build the argument list for the controller method.
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

        // Execute after-middlewares once the response is fully sent.
        res.on('finish', () => {
          afterMiddlewares.forEach((middleware) => {
            middleware.function(result, req, res);
          });
        });

        if (hasResponseDecorator) {
          return;
        }

        if (
          ControllerService.handleRedirect(target, route, redirect, result, res)
        ) {
          return;
        }

        if (!result) {
          res.status(DefaultNoContentStatus).end();
          return;
        }

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
    res: HttpResponse
  ): boolean {
    if (!redirect) {
      return false;
    }

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
      finalLocation = '/';
    }

    res.redirect(status, `${targetPath}${finalLocation}`);
    return true;
  }

  public handleSuccessResponse(
    route: RouteMetadata,
    target: Function,
    res: HttpResponse,
    result: any
  ): void {
    const { method, handlerName } = route;
    const httpStatus = MetadataStorage.getHttpStatusForHandler(
      target,
      handlerName
    );

    const status = ControllerService.getStatus(
      method as RouteMethods,
      httpStatus,
      result
    );

    for (const serializer of this.serializers) {
      if (serializer.canHandle(result)) {
        serializer.serialize(result, res, status);
        return;
      }
    }
  }

  public handleErrorResponse(
    error: any,
    res: HttpResponse,
    next: HttpNextFunction
  ): void {
    if (error instanceof GenericError || error instanceof DtoValidationError) {
      res
        .status(error.status)
        .json({ status: error.status, message: error.message });
    } else {
      next(error);
    }
  }
}

export const ControllerService = new ControllerServiceImpl();
