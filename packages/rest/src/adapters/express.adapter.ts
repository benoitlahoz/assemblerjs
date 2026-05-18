import { Server } from 'node:http';
import type { Application } from 'express';
import express from 'express';
import { Assemblage } from 'assemblerjs';
import type {
  HttpMiddleware,
  HttpRequest,
  HttpResponse,
  HttpNextFunction,
} from '@/http.types';
import { AbstractHttpAdapter } from './adapter.abstract';

@Assemblage()
export class ExpressAdapter implements AbstractHttpAdapter {
  public readonly app: Application;
  private server?: Server;

  public use: Application['use'];

  constructor() {
    this.app = express();

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

  public listen(port: number) {
    this.server = this.app.listen(port);
  }

  public close() {
    this.server?.close();
  }

  public get listening(): boolean {
    return this.server?.listening || false;
  }

  public get routes(): string[] {
    return this.app.router.stack.map((r: any) => r.route.path);
  }
}
