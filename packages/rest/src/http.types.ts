/**
 * Framework-agnostic HTTP interfaces for the controller layer.
 * Any web framework adapter (Express, Fastify, Hono…) must satisfy these shapes.
 */

export interface HttpRequest {
  body: any;
  params: Record<string, string>;
  query: Record<string, any>;
  path: string;
  headers: Record<string, string | string[] | undefined>;
  cookies?: Record<string, any>;
}

export interface HttpResponse {
  status(code: number): this;
  json(body: any): this;
  send(body?: any): this;
  sendStatus(code: number): this;
  setHeader(name: string, value: string | string[]): this;
  redirect(status: number, url: string): this;
  on(event: string, callback: (...args: any[]) => void): this;
  end(): void;
}

export type HttpNextFunction = (err?: any) => void;

/** Middleware executed before the route handler, scoped to a single route. */
export type HttpMiddleware = (
  req: HttpRequest,
  res: HttpResponse,
  next: HttpNextFunction
) => void | Promise<void>;

/** Middleware executed after the route handler, receiving the handler's result. */
export type AfterHttpMiddleware = (
  result: any,
  req: HttpRequest,
  res: HttpResponse
) => void | Promise<void>;
