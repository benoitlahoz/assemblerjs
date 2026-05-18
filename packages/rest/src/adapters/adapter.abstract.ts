import { AbstractAssemblage } from 'assemblerjs';
import type {
  HttpMiddleware,
  HttpRequest,
  HttpResponse,
  HttpNextFunction,
} from '@/http.types';

export abstract class WebFrameworkAdapter extends AbstractAssemblage {
  /**
   * Register a route with the underlying HTTP framework.
   *
   * @param method       HTTP method in lowercase (get, post, put, …)
   * @param path         Full normalised route path
   * @param middlewares  Before-middlewares scoped to this route only
   * @param handler      Async route handler
   */
  abstract registerRoute(
    method: string,
    path: string,
    middlewares: HttpMiddleware[],
    handler: (
      req: HttpRequest,
      res: HttpResponse,
      next: HttpNextFunction
    ) => Promise<void>
  ): void;
}
