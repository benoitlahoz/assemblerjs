import type { FastifyReply } from 'fastify';
import type { HttpResponse } from '@/http.types';

/**
 * Bridges a Fastify reply to the framework-agnostic `HttpResponse` interface.
 *
 * Fastify replies are not mutable objects like Express responses — each method
 * call delegates to the Fastify reply API, and `end()` / `send()` finalise the
 * response via the underlying `ServerResponse`.
 */
export class FastifyResponseShim implements HttpResponse {
  constructor(private readonly reply: FastifyReply) {}

  status(code: number): this {
    this.reply.status(code);
    return this;
  }

  json(body: any): this {
    this.reply.send(body);
    return this;
  }

  send(body?: any): this {
    this.reply.send(body);
    return this;
  }

  sendStatus(code: number): this {
    this.reply.status(code).send();
    return this;
  }

  setHeader(name: string, value: string | string[]): this {
    this.reply.header(name, Array.isArray(value) ? value.join(', ') : value);
    return this;
  }

  redirect(status: number, url: string): this {
    this.reply.redirect(url, status);
    return this;
  }

  on(event: string, callback: (...args: any[]) => void): this {
    // Fastify does not expose EventEmitter on reply directly — delegate to raw
    this.reply.raw.on(event, callback);
    return this;
  }

  end(): void {
    // Use reply.send() so Fastify flushes its managed headers (set via
    // reply.header()) before closing the connection. Calling reply.raw.end()
    // directly would bypass Fastify's response pipeline and lose those headers.
    this.reply.send();
  }
}
