import type { Request, Response } from 'express';
import { AssemblerContext } from 'assemblerjs';
import { ControllerPrivateKeys } from '@/decorators/constructor/controller.keys';
import { DecoratedParameterPrivateKeys } from '@/decorators/parameters/parameters-decorators.keys';
import type {
  ParametersMetadata,
  CustomParameterMetadata,
  HttpHeadersMetadata,
  HttpStatusMetadata,
  MiddlewareMetadata,
  RedirectMetadata,
  RouteMetadata,
} from './metadata.types';

class _MetadataStorage {
  ////////////////////////////////////////////////////////////////////////////
  //
  // Routes
  //
  ////////////////////////////////////////////////////////////////////////////

  public addRoute(
    controller: any,
    method: string,
    path: string,
    handlerName: string | symbol,
    info: string
  ): void {
    const controllerClass = controller.constructor;
    const routes: RouteMetadata[] =
      Reflect.getMetadata(ControllerPrivateKeys.Routes, controllerClass) || [];
    routes.push({
      method,
      path,
      handlerName,
      info,
    });
    Reflect.defineMetadata(
      ControllerPrivateKeys.Routes,
      routes,
      controllerClass
    );
  }

  public getRoutes(controller: any): RouteMetadata[] {
    const controllerClass = controller.constructor;
    return (
      Reflect.getMetadata(ControllerPrivateKeys.Routes, controllerClass) || []
    );
  }

  ////////////////////////////////////////////////////////////////////////////
  //
  // HTTP Statuses
  //
  ////////////////////////////////////////////////////////////////////////////

  public addHttpStatus(
    controller: any,
    propertyKey: string | symbol,
    status: number
  ): void {
    const controllerClass = controller.constructor;
    const statuses: any[] =
      Reflect.getMetadata(ControllerPrivateKeys.HttpStatus, controllerClass) ||
      [];
    statuses.push({
      handlerName: propertyKey,
      status,
    });
    Reflect.defineMetadata(
      ControllerPrivateKeys.HttpStatus,
      statuses,
      controllerClass
    );
  }

  public getHttpStatuses(controller: any): HttpStatusMetadata[] {
    const controllerClass = controller.constructor;
    return (
      Reflect.getMetadata(ControllerPrivateKeys.HttpStatus, controllerClass) ||
      []
    );
  }

  public getHttpStatusForHandler(
    controller: any,
    handlerName: string | symbol
  ): HttpStatusMetadata | undefined {
    const statuses = this.getHttpStatuses(controller);
    return statuses.find((status) => status.handlerName === handlerName);
  }

  ////////////////////////////////////////////////////////////////////////////
  //
  // Redirects
  //
  ////////////////////////////////////////////////////////////////////////////

  public addRedirect(
    controller: any,
    propertyKey: string | symbol,
    location?: string,
    status?: number
  ): void {
    const controllerClass = controller.constructor;
    const redirections: any[] =
      Reflect.getMetadata(ControllerPrivateKeys.Redirect, controllerClass) ||
      [];
    redirections.push({
      handlerName: propertyKey,
      location,
      status,
    });
    Reflect.defineMetadata(
      ControllerPrivateKeys.Redirect,
      redirections,
      controllerClass
    );
  }

  public getRedirects(controller: any): RedirectMetadata[] {
    const controllerClass = controller.constructor;
    return (
      Reflect.getMetadata(ControllerPrivateKeys.Redirect, controllerClass) || []
    );
  }

  public getRedirectForHandler(
    controller: any,
    handlerName: string | symbol
  ): RedirectMetadata | undefined {
    const redirects = this.getRedirects(controller);
    return redirects.find((redirect) => redirect.handlerName === handlerName);
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  // HTTP Headers
  //
  /////////////////////////////////////////////////////////////////////////////

  public addHttpHeaders(
    controller: any,
    propertyKey: string | symbol,
    headers: Record<string, string>
  ): void {
    const controllerClass = controller.constructor;
    const httpHeaders: any[] =
      Reflect.getMetadata(ControllerPrivateKeys.HttpHeaders, controllerClass) ||
      [];
    httpHeaders.push({
      handlerName: propertyKey,
      headers,
    });
    Reflect.defineMetadata(
      ControllerPrivateKeys.HttpHeaders,
      httpHeaders,
      controllerClass
    );
  }

  public getHttpHeaders(controller: any): HttpHeadersMetadata[] {
    const controllerClass = controller.constructor;
    return (
      Reflect.getMetadata(ControllerPrivateKeys.HttpHeaders, controllerClass) ||
      []
    );
  }

  public getHttpHeadersForHandler(
    controller: any,
    handlerName: string | symbol
  ): Record<string, string> | undefined {
    const headers = this.getHttpHeaders(controller);
    const header = headers.find((header) => header.handlerName === handlerName);
    return header ? header.headers : undefined;
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  // Before Middlewares
  //
  /////////////////////////////////////////////////////////////////////////////

  public addBeforeMiddleware(
    controller: any,
    propertyKey: string | symbol,
    middleware: any
  ): void {
    const controllerClass = controller.constructor;
    const middlewares: any[] =
      Reflect.getMetadata(
        ControllerPrivateKeys.BeforeMiddlewares,
        controllerClass
      ) || [];
    middlewares.push({
      handlerName: propertyKey,
      function: middleware,
    });
    Reflect.defineMetadata(
      ControllerPrivateKeys.BeforeMiddlewares,
      middlewares,
      controllerClass
    );
  }

  public getBeforeMiddlewares(controller: any): MiddlewareMetadata[] {
    const controllerClass = controller.constructor;
    return (
      Reflect.getMetadata(
        ControllerPrivateKeys.BeforeMiddlewares,
        controllerClass
      ) || []
    );
  }

  public getBeforeMiddlewaresForHandler(
    controller: any,
    handlerName: string | symbol
  ): MiddlewareMetadata[] | [] {
    const middlewares = this.getBeforeMiddlewares(controller);
    return middlewares.filter(
      (middleware) => middleware.handlerName === handlerName
    );
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  // After Middlewares
  //
  /////////////////////////////////////////////////////////////////////////////

  public addAfterMiddleware(
    controller: any,
    propertyKey: string | symbol,
    middleware: any
  ): void {
    const controllerClass = controller.constructor;
    const middlewares: any[] =
      Reflect.getMetadata(
        ControllerPrivateKeys.AfterMiddlewares,
        controllerClass
      ) || [];
    middlewares.push({
      handlerName: propertyKey,
      function: middleware,
    });
    Reflect.defineMetadata(
      ControllerPrivateKeys.AfterMiddlewares,
      middlewares,
      controllerClass
    );
  }

  public getAfterMiddlewares(controller: any): MiddlewareMetadata[] {
    const controllerClass = controller.constructor;
    return (
      Reflect.getMetadata(
        ControllerPrivateKeys.AfterMiddlewares,
        controllerClass
      ) || []
    );
  }

  public getAfterMiddlewaresForHandler(
    controller: any,
    handlerName: string | symbol
  ): MiddlewareMetadata[] | [] {
    const middlewares = this.getAfterMiddlewares(controller);
    return middlewares.filter(
      (middleware) => middleware.handlerName === handlerName
    );
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  // Parameters
  //
  /////////////////////////////////////////////////////////////////////////////

  public addParameter(
    type: DecoratedParameterPrivateKeys,
    controller: any,
    propertyKey: string | symbol | undefined,
    index: number,
    identifier?: any
  ): void {
    const prop = String(propertyKey);
    const metadata = (Reflect.getMetadata(
      ControllerPrivateKeys.Parameters,
      controller
    ) || {}) as ParametersMetadata;

    metadata[type] = metadata[type] || {};
    metadata[type][prop] = metadata[type][prop] || {};
    metadata[type][prop][index] = identifier;

    Reflect.defineMetadata(
      ControllerPrivateKeys.Parameters,
      metadata,
      controller
    );
  }

  public hasParameter(
    type: DecoratedParameterPrivateKeys,
    controller: any,
    propertyKey: string | symbol | undefined
  ): boolean {
    const metadata = this.getParameters(controller);
    if (!metadata || !metadata[type]) {
      return false;
    }
    const prop = String(propertyKey);
    return !!metadata[type][prop];
  }

  public getParameters(controller: any): ParametersMetadata | undefined {
    return Reflect.getMetadata(ControllerPrivateKeys.Parameters, controller);
  }

  public getParametersForHandler(
    controller: any,
    propertyKey: string | symbol | undefined
  ): Record<string, any> | undefined {
    const metadata = this.getParameters(controller);
    if (!metadata) {
      return;
    }
    const prop = String(propertyKey) as keyof ParametersMetadata;
    return metadata[prop];
  }

  public getParametersOfTypeForHandler(
    controller: any,
    propertyKey: string | symbol | undefined,
    typeKey: DecoratedParameterPrivateKeys
  ): Record<string, any> | undefined {
    const metadata = this.getParameters(controller);
    const prop = String(propertyKey);
    if (!metadata || !metadata[typeKey]) {
      return;
    }
    return metadata[typeKey][prop];
  }

  //////////////////////////////////////////////////////////////////////////////
  //
  // Custom Parameters
  //
  //////////////////////////////////////////////////////////////////////////////

  public addCustomParameter(
    controller: any,
    propertyKey: string | symbol | undefined,
    index: number,
    fn: (
      req: Request,
      res: Response,
      context: AssemblerContext,
      identifier: string | undefined
    ) => void,
    identifier = ''
  ): void {
    const prop = String(propertyKey);

    const metadata: CustomParameterMetadata =
      Reflect.getMetadata(ControllerPrivateKeys.CustomParameters, controller) ||
      {};

    metadata[prop] = metadata[prop] || {};
    metadata[prop][index] = {
      identifier,
      fn,
    };

    Reflect.defineMetadata(
      ControllerPrivateKeys.CustomParameters,
      metadata,
      controller
    );
  }

  public getCustomParameters(
    controller: any
  ): CustomParameterMetadata | undefined {
    return Reflect.getMetadata(
      ControllerPrivateKeys.CustomParameters,
      controller
    );
  }

  public getCustomParametersForHandler(
    controller: any,
    propertyKey: string | symbol | undefined
  ): Record<string, any> | undefined {
    const metadata = this.getCustomParameters(controller);
    if (!metadata) {
      return;
    }
    const prop = String(propertyKey) as keyof CustomParameterMetadata;
    return metadata[prop];
  }
}

export const MetadataStorage = new _MetadataStorage();
