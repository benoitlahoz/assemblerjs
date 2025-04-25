import type { Server } from 'node:http';
import http from 'node:http';
import https from 'node:https';
import type { Application } from 'express';
import express from 'express';
import { Assemblage, Configuration } from 'assemblerjs';
import type { FrameworkConfiguration } from './adapter.abstract';
import { FrameworkAdapter } from './adapter.abstract';

@Assemblage()
export class ExpressAdapter implements FrameworkAdapter {
  public readonly app: Application;
  private server?: Server;

  public all: Application['all'];
  public use: Application['use'];
  public get: Application['get'];
  public post: Application['post'];
  public delete: Application['delete'];
  public put: Application['put'];
  public patch: Application['patch'];
  public options: Application['options'];
  public head: Application['head'];
  public trace: Application['trace'];
  public connect: Application['connect'];
  public listen: Server['listen'];

  constructor(@Configuration() private configuration: FrameworkConfiguration) {
    this.app = express();
    this.createServer();

    this.all = this.app.all.bind(this.app);
    this.use = this.app.use.bind(this.app);
    this.get = this.app.get.bind(this.app);
    this.post = this.app.post.bind(this.app);
    this.delete = this.app.delete.bind(this.app);
    this.put = this.app.put.bind(this.app);
    this.patch = this.app.patch.bind(this.app);
    this.options = this.app.options.bind(this.app);
    this.head = this.app.head.bind(this.app);
    this.trace = this.app.trace.bind(this.app);
    this.connect = this.app.connect.bind(this.app);

    this.listen = this.server!.listen.bind(this.server);
  }

  public onDispose(): void {
    this.close();
  }

  public close() {
    this.server?.close();
  }

  private createServer(): void {
    if (this.configuration?.https) {
      this.server = https.createServer(this.configuration.https, this.app);
      return;
    }

    this.server = http.createServer(this.app);
  }

  public get listening(): boolean {
    return this.server?.listening || false;
  }

  public get routes(): string[] {
    return this.app.router.stack.map((r: any) => r.route.path);
  }
}
