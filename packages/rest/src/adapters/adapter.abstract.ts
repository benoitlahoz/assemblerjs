import type { Server } from 'node:http';
import { AbstractAssemblage } from 'assemblerjs';
import type {
  HttpMiddleware,
  HttpRequest,
  HttpResponse,
  HttpNextFunction,
} from '@/http.types';

export abstract class AbstractHttpAdapter extends AbstractAssemblage {
  /**
   * The underlying Node.js `http.Server` instance.
   * Always defined after construction — before `listen()` is called.
   */
  abstract readonly httpServer: Server;

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

  /** Start listening on the given port. */
  abstract listen(
    port: number,
    host?: string,
    backlog?: number
  ): void | Promise<void>;

  /** Stop the server and release the port. */
  abstract close(): void | Promise<void>;

  /** Whether the server is currently listening. */
  abstract get listening(): boolean;
}
