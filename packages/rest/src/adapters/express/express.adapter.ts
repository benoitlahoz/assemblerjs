import { createServer, type Server } from 'node:http';
import type { Application } from 'express';
import express from 'express';
import { Assemblage } from 'assemblerjs';
import type {
  HttpMiddleware,
  HttpRequest,
  HttpResponse,
  HttpNextFunction,
} from '@/http.types';
import { AbstractHttpAdapter } from '../adapter.abstract';
import { HttpAdapter } from '../http-adapter.decorator';

@HttpAdapter()
@Assemblage()
export class ExpressAdapter implements AbstractHttpAdapter {
  public readonly app: Application;
  public readonly httpServer: Server;

  public use: Application['use'];

  constructor() {
    this.app = express();
    // Created in the constructor so Socket.IO (and other consumers) can attach
    // to the http.Server before listen() is called. Routes are registered on
    // this.app, not on httpServer, so order doesn't matter.
    this.httpServer = createServer(this.app);

    this.use = this.app.use.bind(this.app);

    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.json());
  }

  /**
   * Register a route with Express, scoping before-middlewares to the route path.
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
    (this.app as any)[method](path, ...middlewares, handler);
  }

  onDispose(): void {
    this.close();
  }

  public listen(port: number): void {
    this.httpServer.listen(port);
  }

  public close(): void {
    this.httpServer.close();
  }

  public get listening(): boolean {
    return this.httpServer?.listening ?? false;
  }

  public get routes(): string[] {
    return this.app.router.stack.map((r: any) => r.route.path);
  }
}
