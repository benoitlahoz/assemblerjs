import type { FastifyRequest } from 'fastify';
import type { HttpRequest } from '@/http.types';

/**
 * Bridges a Fastify request to the framework-agnostic `HttpRequest` interface.
 */
export class FastifyRequestShim implements HttpRequest {
  constructor(private readonly req: FastifyRequest) {}

  get body(): any {
    return this.req.body;
  }

  get params(): Record<string, string> {
    return (this.req.params as Record<string, string>) ?? {};
  }

  get query(): Record<string, any> {
    return (this.req.query as Record<string, any>) ?? {};
  }

  get path(): string {
    // Fastify exposes the full URL including query string on req.url
    return this.req.url.split('?')[0];
  }

  get headers(): Record<string, string | string[] | undefined> {
    return this.req.headers as Record<string, string | string[] | undefined>;
  }

  get cookies(): Record<string, any> | undefined {
    // Requires @fastify/cookie plugin — graceful fallback if absent
    return (this.req as any).cookies;
  }
}
