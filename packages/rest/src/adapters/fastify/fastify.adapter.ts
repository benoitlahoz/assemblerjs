import type { FastifyInstance, HTTPMethods } from 'fastify';
import Fastify from 'fastify';
import type { Server } from 'node:http';
import { Assemblage } from 'assemblerjs';
import type {
  HttpMiddleware,
  HttpRequest,
  HttpResponse,
  HttpNextFunction,
} from '@/http.types';
import { AbstractHttpAdapter } from '../adapter.abstract';
import { HttpAdapter } from '../http-adapter.decorator';
import { FastifyRequestShim } from './fastify-request.shim';
import { FastifyResponseShim } from './fastify-response.shim';

@HttpAdapter()
@Assemblage()
export class FastifyAdapter implements AbstractHttpAdapter {
  public readonly app: FastifyInstance;
  /**
   * The underlying `http.Server` that Fastify creates internally.
   * Available immediately after construction — before `listen()`.
   */
  public readonly httpServer: Server;

  constructor() {
    this.app = Fastify({ logger: false });
    // Fastify creates its http.Server lazily but exposes it as `.server` immediately.
    this.httpServer = this.app.server as unknown as Server;
  }

  /**
   * Register a route with Fastify, converting `HttpMiddleware` functions to
   * Fastify `preHandler` hooks so they run before the route handler.
   */
  public registerRoute(
    method: string,
    path: string,
    middlewares: HttpMiddleware[],
    handler: (
      req: HttpRequest,
      res: HttpResponse,
      next: HttpNextFunction
    ) => Promise<void>
  ): void {
    const preHandlers = middlewares.map(
      (mw) => async (req: any, reply: any) => {
        await new Promise<void>((resolve, reject) => {
          mw(
            new FastifyRequestShim(req),
            new FastifyResponseShim(reply),
            (err?: any) => (err ? reject(err) : resolve())
          );
        });
      }
    );

    this.app.route({
      method: method.toUpperCase() as HTTPMethods,
      url: path,
      preHandler: preHandlers,
      handler: async (req, reply) => {
        await handler(
          new FastifyRequestShim(req),
          new FastifyResponseShim(reply),
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          () => {}
        );
      },
    });
  }

  onDispose(): void {
    this.close();
  }

  public async listen(port: number): Promise<void> {
    await this.app.listen({ port, host: '0.0.0.0' });
  }

  public async close(): Promise<void> {
    await this.app.close();
  }

  public get listening(): boolean {
    return this.httpServer?.listening ?? false;
  }
}
