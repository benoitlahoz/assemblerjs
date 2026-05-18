import 'reflect-metadata';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import SwaggerParser from '@apidevtools/swagger-parser';
import { AbstractAssemblage, Assemblage, Assembler, Dispose } from 'assemblerjs';
import { AbstractHttpAdapter } from '@assemblerjs/rest';
import { ExpressAdapter } from '@assemblerjs/rest/express';
import { AbstractOpenApiModule, OpenApiModule } from '../src';
import { UserController } from './api/user.controller';

const PORT = 19100;
const BASE = `http://localhost:${PORT}`;

describe('OpenAPI e2e', () => {
  it('serves the OpenAPI spec at /openapi/json', async () => {
    @Assemblage({
      provide: [
        [AbstractHttpAdapter, ExpressAdapter],
        [UserController],
        [
          AbstractOpenApiModule,
          OpenApiModule,
          {
            info: { title: 'Test API', version: '1.0.0', description: 'E2E test API' },
            servers: [{ url: BASE }],
          },
        ],
      ],
    })
    class App implements AbstractAssemblage {
      constructor(
        public server: AbstractHttpAdapter,
        public users: UserController,
        public openApi: AbstractOpenApiModule,
        @Dispose() public dispose: () => void
      ) {}

      public onInited(): void {
        this.server.listen(PORT);
      }
    }

    const app = Assembler.build(App);

    await new Promise<void>((resolve) => {
      setTimeout(async () => {
        expect(app.server.listening).toBeTruthy();

        // ── 1. The endpoint exists and returns JSON ──────────────────────
        const res = await fetch(`${BASE}/openapi/json`);
        expect(res.ok).toBeTruthy();
        expect(res.headers.get('content-type')).toContain('application/json');

        const spec = await res.json() as any;

        // ── Save spec to e2e/logs/openapi.json ───────────────────────────
        const logsDir = join(__dirname, 'logs');
        mkdirSync(logsDir, { recursive: true });
        writeFileSync(join(logsDir, 'openapi.json'), JSON.stringify(spec, null, 2));

        // ── 2. Envelope ───────────────────────────────────────────────────
        expect(spec.openapi).toBe('3.0.3');
        expect(spec.info).toMatchObject({ title: 'Test API', version: '1.0.0' });
        expect(spec.servers).toEqual([{ url: BASE }]);

        // ── 3. UserController paths are present ───────────────────────────
        expect(spec.paths['/users']).toBeDefined();
        expect(spec.paths['/users/{id}']).toBeDefined();

        // ── 4. GET /users — @Operation summary wins ───────────────────────
        const getAll = spec.paths['/users']['get'];
        expect(getAll).toBeDefined();
        expect(getAll.summary).toBe('List all users');
        expect(getAll.tags).toContain('users');

        // ── 5. GET /users — @Returns(200, UserDto) produces a $ref ───────
        const getAll200 = getAll.responses['200'];
        expect(getAll200).toBeDefined();
        expect(getAll200.content['application/json'].schema).toEqual({
          $ref: '#/components/schemas/UserDto',
        });

        // ── 6. UserDto schema is in components ────────────────────────────
        expect(spec.components?.schemas?.['UserDto']).toBeDefined();
        const dtoSchema = spec.components.schemas['UserDto'];
        expect(dtoSchema.type).toBe('object');
        expect(dtoSchema.properties).toHaveProperty('id');
        expect(dtoSchema.properties).toHaveProperty('name');
        expect(dtoSchema.properties).toHaveProperty('gender');

        // ── 7. @Throws(404) is in the spec ───────────────────────────────
        const getById = spec.paths['/users/{id}']['get'];
        expect(getById.responses['404']).toMatchObject({ description: 'User not found' });

        // ── 8. POST /users — 201 + description ───────────────────────────
        const post = spec.paths['/users']['post'];
        expect(post).toBeDefined();
        expect(post.responses['201']).toBeDefined();
        expect(post.description).toBe('Creates a new user entry.');

        // ── 9. DELETE /users/{id} is present ──────────────────────────────
        expect(spec.paths['/users/{id}']['delete']).toBeDefined();

        // ── 10. @Hidden() on handler hides it ────────────────────────────
        expect(spec.paths['/users/hidden']).toBeUndefined();

        // ── 11. The /openapi/json endpoint itself is NOT in the spec ──────
        expect(spec.paths['/openapi/json']).toBeUndefined();

        await app.dispose();
        resolve();
      }, 100);
    });
  });

  it('returns 400 when POST /users body fails DTO validation', async () => {
    @Assemblage({
      provide: [
        [AbstractHttpAdapter, ExpressAdapter],
        [UserController],
        [
          AbstractOpenApiModule,
          OpenApiModule,
          {
            info: { title: 'Validation Test', version: '1.0.0' },
            servers: [{ url: `http://localhost:${PORT + 1}` }],
          },
        ],
      ],
    })
    class App2 implements AbstractAssemblage {
      constructor(
        public server: AbstractHttpAdapter,
        public users: UserController,
        public openApi: AbstractOpenApiModule,
        @Dispose() public dispose: () => void
      ) {}

      public onInited(): void {
        this.server.listen(PORT + 1);
      }
    }

    const app2 = Assembler.build(App2);

    // Wait for the server to be ready
    await new Promise<void>((r) => setTimeout(r, 100));

    // Missing required `name` and `gender` fields — DTO validation must fail
    const res = await fetch(`http://localhost:${PORT + 1}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unexpected: true }),
    });

    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.status).toBe(400);

    await app2.dispose();
  });

  it('generates a valid OpenAPI 3.0 document', async () => {
    @Assemblage({
      provide: [
        [AbstractHttpAdapter, ExpressAdapter],
        [UserController],
        [
          AbstractOpenApiModule,
          OpenApiModule,
          {
            info: { title: 'Validate Test', version: '1.0.0' },
            servers: [{ url: `http://localhost:${PORT + 2}` }],
          },
        ],
      ],
    })
    class App3 implements AbstractAssemblage {
      constructor(
        public server: AbstractHttpAdapter,
        public users: UserController,
        public openApi: AbstractOpenApiModule,
        @Dispose() public dispose: () => void
      ) {}

      public onInited(): void {
        this.server.listen(PORT + 2);
      }
    }

    const app3 = Assembler.build(App3);

    await new Promise<void>((r) => setTimeout(r, 100));

    const res = await fetch(`http://localhost:${PORT + 2}/openapi/json`);
    const spec = await res.json();

    // Throws if the document is not a valid OpenAPI 3.x document
    await expect(SwaggerParser.validate(structuredClone(spec))).resolves.toBeDefined();

    await app3.dispose();
  });
});
