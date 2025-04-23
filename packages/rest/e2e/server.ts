import { Server } from 'node:http';
import type { Application } from 'express';
import express from 'express';
import { Assemblage } from 'assemblerjs';
import { WebFrameworkAdapter } from '../src';

@Assemblage()
export class ExpressAdapter implements WebFrameworkAdapter {
  public readonly app: Application;
  private server?: Server;

  constructor() {
    this.app = express();
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.json());
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
