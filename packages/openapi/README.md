# @assemblerjs/openapi

Automatic OpenAPI 3.0 spec generation for AssemblerJS REST APIs — zero configuration, runtime-based, fully integrated with `@assemblerjs/rest` and `@assemblerjs/dto`.

## Overview

`@assemblerjs/openapi` inspects the metadata registered by `@assemblerjs/rest` route decorators and generates a valid OpenAPI 3.0.3 JSON document at runtime. No separate code-generation step, no extra build tooling.

- Tags are auto-derived from the controller base path (`/users/admin` → `users`).
- DTO schemas are extracted automatically via `DtoSchemaExtractor` when you annotate a response with `@Returns(200, MyDto)`.
- The `GET /openapi/json` endpoint is served by a built-in controller that excludes itself from the spec.

## Features

- **Zero config** — Mount the module, pass `info`, done.
- **`@Returns` / `@Throws`** — Declarative per-handler response documentation.
- **`@Operation`** — Optional long-form description and deprecation flag.
- **`@Hidden`** — Exclude a controller class or a specific handler from the spec.
- **DTO schemas** — Automatic JSON Schema extraction from `class-validator` metadata.
- **Auto-tagging** — Tag derived from the first path segment of each controller.
- **AssemblerJS DI** — Fully injectable, configurable via `ConfiguredInjection`.

## Installation

```bash
npm install @assemblerjs/openapi assemblerjs @assemblerjs/rest reflect-metadata
# or
yarn add @assemblerjs/openapi assemblerjs @assemblerjs/rest reflect-metadata
```

## Quick Start

```typescript
import 'reflect-metadata';
import { Assemblage, Assembler, AbstractAssemblage, Dispose } from 'assemblerjs';
import { AbstractHttpAdapter, ExpressAdapter, Controller, Get, Post, Param, Body } from '@assemblerjs/rest';
import { AbstractOpenApiModule, OpenApiModule, Returns, Throws, Hidden, Operation } from '@assemblerjs/openapi';

@Controller({ path: '/users' })
@Assemblage()
class UserController implements AbstractAssemblage {
  private users = [{ id: 1, name: 'Alice' }];

  @Returns(200)
  @Get('/')
  getAll() { return this.users; }

  @Throws(404, 'User not found')
  @Returns(200)
  @Get('/:id')
  getOne(@Param('id') id: string) {
    return this.users.find((u) => u.id === Number(id));
  }

  @Returns(201)
  @Post('/')
  create(@Body() body: { name: string }) {
    const user = { id: this.users.length + 1, ...body };
    this.users.push(user);
    return user;
  }
}

@Assemblage({
  provide: [
    [AbstractHttpAdapter, ExpressAdapter],
    [UserController],
    [AbstractOpenApiModule, OpenApiModule, {
      info: { title: 'My API', version: '1.0.0' },
      servers: [{ url: 'http://localhost:3000' }],
    }],
  ],
})
class App implements AbstractAssemblage {
  constructor(
    private server: AbstractHttpAdapter,
    private users: UserController,
    private openapi: AbstractOpenApiModule,
    @Dispose() private dispose: () => void
  ) {}

  public async onInited() {
    this.server.listen(3000);
    // GET http://localhost:3000/openapi/json → OpenAPI spec
  }
}

Assembler.build(App);
```

## Decorators

### `@Returns(status, dtoClass?, description?)`

Documents a successful response. If a DTO class is provided, its JSON Schema is extracted from `class-validator` metadata and added to `components/schemas`.

```typescript
import { IsString, IsInt } from 'class-validator';
import { Dto } from '@assemblerjs/dto';
import { Returns } from '@assemblerjs/openapi';

@Dto()
class UserDto {
  @IsInt() id!: number;
  @IsString() name!: string;
}

@Returns(200, UserDto, 'Returns the user')
@Get('/:id')
getUser(@Param('id') id: string) { ... }
```

### `@Throws(status, description?)`

Documents an error response.

```typescript
@Throws(404, 'User not found')
@Throws(400, 'Invalid ID')
@Get('/:id')
getUser(@Param('id') id: string) { ... }
```

### `@Operation(meta)`

Enriches a handler's OpenAPI operation with a summary, long-form description or deprecation flag. `summary` takes priority over the inline second argument of `@Get`/`@Post`/etc.

```typescript
import { Operation } from '@assemblerjs/openapi';

@Operation({ summary: 'List users', description: 'Returns all users, sorted by creation date.', deprecated: false })
@Get('/')
getAll() { ... }
```

### `@Hidden()`

Excludes a controller class (all its routes) or a single handler from the generated spec.

```typescript
// Exclude the whole controller
@Hidden()
@Controller({ path: '/internal' })
@Assemblage()
class InternalController implements AbstractAssemblage { ... }

// Exclude a single handler
@Hidden()
@Get('/health')
healthCheck() { return 'ok'; }
```

## Module configuration

`OpenApiModule` is registered as a `ConfiguredInjection` — the third element of the tuple is the options object.

```typescript
[AbstractOpenApiModule, OpenApiModule, {
  info: {
    title: 'My API',
    version: '1.0.0',
    description: 'Optional long description',   // optional
  },
  servers: [
    { url: 'https://api.example.com', description: 'Production' },
    { url: 'http://localhost:3000',   description: 'Development' },
  ],
}]
```

| Field | Type | Required |
|---|---|---|
| `info.title` | `string` | ✓ |
| `info.version` | `string` | ✓ |
| `info.description` | `string` | — |
| `servers` | `{ url: string; description?: string }[]` | — |

## Spec endpoint

The spec is served at `GET /openapi/json`. The `OpenApiController` carrying this route is automatically excluded from the spec via `@Hidden()`.

## Auto-tagging

Each controller's routes are grouped under the first non-empty segment of the controller's base path:

| Base path | Tag |
|---|---|
| `/users` | `users` |
| `/api/v1/orders` | `api` |
| `/` | `MyController` (class name fallback) |

Tags cannot be overridden per-handler. If you need distinct tags, use distinct controller base paths.

## DTO Schema extraction

When `@Returns(200, MyDto)` is used, `DtoSchemaExtractor.extract(MyDto)` reads the `class-validator` metadata on `MyDto` and maps it to an OpenAPI-compatible JSON Schema. The schema is added to `components/schemas` and referenced with `$ref`.

Supported validators: `@IsString`, `@IsInt`, `@IsNumber`, `@IsBoolean`, `@IsArray`, `@IsEmail`, `@MinLength`, `@MaxLength`, `@Min`, `@Max`, `@IsOptional`.

