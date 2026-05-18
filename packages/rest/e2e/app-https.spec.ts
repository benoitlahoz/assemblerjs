import 'reflect-metadata';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { request as httpsRequest } from 'node:https';
import { describe, it, expect } from 'vitest';
import {
  AbstractAssemblage,
  Assemblage,
  Assembler,
  Dispose,
} from 'assemblerjs';
import { AbstractHttpAdapter } from '../src';
import { ExpressAdapter } from '../src/express';
import { FastifyAdapter } from '../src/fastify';
import { ApiController } from './api/api.controller';

// Self-signed certificates used only for local testing.
// Generated with: openssl req -x509 -newkey rsa:2048 -days 3650 -nodes
//   -subj "/CN=localhost" -addext "subjectAltName=IP:127.0.0.1,DNS:localhost"
// @ts-ignore - Allow importing .pem files as buffers without a custom loader.
const certsDir = join(import.meta.dirname, 'certs');
const tlsConfig = {
  key: readFileSync(join(certsDir, 'key.pem')),
  cert: readFileSync(join(certsDir, 'cert.pem')),
};

// Minimal fetch-like helper using node:https directly.
// Bypasses certificate validation — safe for self-signed test certs only.
interface SimpleResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

function insecureFetch(
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string } = {}
): Promise<SimpleResponse> {
  return new Promise((resolve, reject) => {
    const { hostname, port, pathname, search } = new URL(url);
    const req = httpsRequest(
      {
        hostname,
        port,
        path: pathname + search,
        method: (init.method ?? 'GET').toUpperCase(),
        headers: init.headers,
        rejectUnauthorized: false,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          resolve({
            ok: (res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 300,
            status: res.statusCode ?? 0,
            json: () => Promise.resolve(JSON.parse(body)),
            text: () => Promise.resolve(body),
          });
        });
      }
    );
    req.on('error', reject);
    if (init.body) req.write(init.body);
    req.end();
  });
}

describe('HTTPS — ExpressAdapter', () => {
  it('should serve requests over TLS.', async () => {
    @Assemblage({
      provide: [
        [AbstractHttpAdapter, ExpressAdapter, { tls: tlsConfig }],
        [ApiController],
      ],
    })
    class App implements AbstractAssemblage {
      constructor(
        public server: AbstractHttpAdapter,
        public api: ApiController,
        @Dispose() public dispose: () => void
      ) {}

      public onInited(): void {
        this.server.listen(10002);
      }

      public onDispose(): void {
        expect(this.server.listening).toBeFalsy();
      }
    }

    const app = Assembler.build(App);

    await new Promise<void>((resolve) => {
      setTimeout(async () => {
        expect(app.server.listening).toBeTruthy();

        // Basic GET over HTTPS.
        const res = await insecureFetch('https://localhost:10002/api/user');
        expect(res.ok).toBeTruthy();
        const users = await res.json();
        expect(Array.isArray(users)).toBeTruthy();

        // Basic POST over HTTPS.
        const post = await insecureFetch('https://localhost:10002/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'HTTPS User', gender: 'non-binary' }),
        });
        expect(post.ok).toBeTruthy();
        expect(post.status).toBe(201);
        const created: { name: string; gender: string } = await post.json() as any;
        expect(created.name).toBe('HTTPS User');

        await app.dispose();
        expect(app.server).toBeUndefined();
        resolve();
      }, 150);
    });
  }, 10000);
});

describe('HTTPS — FastifyAdapter', () => {
  it('should serve requests over TLS.', async () => {
    @Assemblage({
      provide: [
        [AbstractHttpAdapter, FastifyAdapter, { tls: tlsConfig }],
        [ApiController],
      ],
    })
    class App implements AbstractAssemblage {
      constructor(
        public server: AbstractHttpAdapter,
        public api: ApiController,
        @Dispose() public dispose: () => void
      ) {}

      public async onInited(): Promise<void> {
        await (this.server as FastifyAdapter).listen(10003);
      }

      public onDispose(): void {
        expect(this.server.listening).toBeFalsy();
      }
    }

    const app = Assembler.build(App);

    await new Promise<void>((resolve) => {
      setTimeout(async () => {
        expect(app.server.listening).toBeTruthy();

        // Basic GET over HTTPS.
        const res = await insecureFetch('https://localhost:10003/api/user');
        expect(res.ok).toBeTruthy();
        const users = await res.json();
        expect(Array.isArray(users)).toBeTruthy();

        // Basic POST over HTTPS.
        const post = await insecureFetch('https://localhost:10003/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'HTTPS User Fastify', gender: 'male' }),
        });
        expect(post.ok).toBeTruthy();
        expect(post.status).toBe(201);
        const created: { name: string; gender: string } = await post.json() as any;
        expect(created.name).toBe('HTTPS User Fastify');

        await app.dispose();
        expect(app.server).toBeUndefined();
        resolve();
      }, 300);
    });
  }, 10000);
});
