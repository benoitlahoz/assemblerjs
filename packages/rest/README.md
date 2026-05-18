# @assemblerjs/rest

REST framework for AssemblerJS with type-safe decorators for controllers, routes, middleware, and request handling. Ships with `ExpressAdapter` and `FastifyAdapter` — swap the HTTP backend without touching your controllers.

## Overview

`@assemblerjs/rest` provides a declarative way to build REST APIs using AssemblerJS. It decouples your controllers and routes from any specific HTTP framework through an adapter layer. Two adapters are provided out of the box:

- **`ExpressAdapter`** — powered by [Express v5](https://expressjs.com/)
- **`FastifyAdapter`** — powered by [Fastify v5](https://fastify.dev/)

Controllers, middleware, parameter extraction, and serialization are all framework-agnostic.

## Features

- 🎯 **Controller Decorators** — Define REST controllers declaratively
- 🛣️ **Route Decorators** — `@Get`, `@Post`, `@Put`, `@Patch`, `@Delete`, `@Head`, `@Options`, …
- 📦 **Parameter Decorators** — `@Body()`, `@Param()`, `@Query()`, `@Header()`, `@Headers()`, `@Cookie()`, `@Cookies()`, `@Req()`, `@Res()`
- 🔌 **Scoped Middleware** — `@Middleware`, `@BeforeMiddleware`, `@AfterMiddleware` per route
- ✅ **DTO Integration** — Works with `@assemblerjs/dto` for automatic validation
- 🔌 **Adapter Pattern** — Swap the HTTP framework without touching controllers (`ExpressAdapter` / `FastifyAdapter`)
- 🔒 **HTTPS** — TLS support for both adapters via `HttpAdapterConfiguration`
- 🏗️ **AssemblerJS DI** — Full dependency injection support
- 🔒 **Type-Safe** — Complete TypeScript support

## Installation

```bash
# Express (default)
npm install @assemblerjs/rest assemblerjs express reflect-metadata
yarn add @assemblerjs/rest assemblerjs express reflect-metadata

# Fastify
npm install @assemblerjs/rest assemblerjs fastify reflect-metadata
yarn add @assemblerjs/rest assemblerjs fastify reflect-metadata
```

```bash
# Optional: DTO validation
npm install @assemblerjs/dto class-validator class-transformer
```

## Quick Start

```typescript
import 'reflect-metadata';
import {
  Assemblage,
  Assembler,
  AbstractAssemblage,
  Dispose,
} from 'assemblerjs';
import {
  AbstractHttpAdapter,
  ExpressAdapter,
  Controller,
  Get,
  Post,
  Body,
  Param,
  NotFoundError,
} from '@assemblerjs/rest';

// 1. Define a controller
@Controller({ path: '/users' })
@Assemblage()
class UserController implements AbstractAssemblage {
  private users = [{ id: 1, name: 'John Doe' }];

  @Get()
  getUsers() {
    return this.users;
  }

  @Get('/:id')
  getUser(@Param('id') id: string) {
    const user = this.users.find((u) => u.id === Number(id));
    if (!user) throw new NotFoundError(`User ${id} not found`);
    return user;
  }

  @Post()
  createUser(@Body() data: { name: string }) {
    const user = { id: this.users.length + 1, ...data };
    this.users.push(user);
    return user;
  }
}

// 2. Bootstrap the application
//    - provide: [[AbstractHttpAdapter, ExpressAdapter]] registers ExpressAdapter
//      as the HTTP adapter; no global: block required.
@Assemblage({
  provide: [[AbstractHttpAdapter, ExpressAdapter], [UserController]],
})
class App implements AbstractAssemblage {
  constructor(
    private server: AbstractHttpAdapter,
    private users: UserController,
    @Dispose() private dispose: () => void
  ) {}

  public async onInited(): Promise<void> {
    this.server.listen(3000);
  }
}

Assembler.build(App);
```

## Adapter Pattern

`@assemblerjs/rest` resolves the HTTP adapter via a tag, not a fixed token. Adapters are registered in the DI `provide` tuple: `[AbstractToken, ConcreteAdapter, optionalConfig?]`.

- Use `ExpressAdapter` or `FastifyAdapter` directly.
- Subclass an existing adapter to add Helmet, CORS, rate-limiting, etc.
- Write a completely custom adapter by implementing `AbstractHttpAdapter` and decorating with `@HttpAdapter()`.

### `ExpressAdapter`

Import from the `@assemblerjs/rest/express` sub-path:

```typescript
import { AbstractHttpAdapter } from '@assemblerjs/rest';
import { ExpressAdapter } from '@assemblerjs/rest/express';

@Assemblage({
  provide: [[AbstractHttpAdapter, ExpressAdapter], [MyController]],
})
class App implements AbstractAssemblage { ... }
```

### `FastifyAdapter`

Import from the `@assemblerjs/rest/fastify` sub-path. `listen()` is async, so `onInited` should be `async`:

```typescript
import { AbstractHttpAdapter } from '@assemblerjs/rest';
import { FastifyAdapter } from '@assemblerjs/rest/fastify';

@Assemblage({
  provide: [[AbstractHttpAdapter, FastifyAdapter], [MyController]],
})
class App implements AbstractAssemblage {
  constructor(
    private server: AbstractHttpAdapter,
    private ctrl: MyController,
    @Dispose() private dispose: () => void
  ) {}

  public async onInited(): Promise<void> {
    await this.server.listen(3000);
  }
}
```

### `listen(port, host?, backlog?)`

Both adapters share the same signature:

| Parameter | Type | Default | Description |
|---|---|---|---|
| `port` | `number` | — | TCP port to bind |
| `host` | `string` | `'0.0.0.0'` | Bind address |
| `backlog` | `number` | — | Connection backlog (Express only) |

### Customizing an adapter

Subclass, add `@HttpAdapter()` above `@Assemblage()`, and register it against any token:

```typescript
import { HttpAdapter, ExpressAdapter, AbstractHttpAdapter } from '@assemblerjs/rest';
import { Assemblage } from 'assemblerjs';
import helmet from 'helmet';

@HttpAdapter()
@Assemblage()
class SecuredAdapter extends ExpressAdapter {
  constructor() {
    super();
    this.app.use(helmet());
    this.app.set('trust proxy', 1);
  }
}

@Assemblage({
  provide: [[AbstractHttpAdapter, SecuredAdapter], [MyController]],
})
class App implements AbstractAssemblage { ... }
```

### Writing a custom adapter

Implement the `AbstractHttpAdapter` contract and decorate with `@HttpAdapter()`:

```typescript
import { HttpAdapter, AbstractHttpAdapter } from '@assemblerjs/rest';
import { Assemblage } from 'assemblerjs';

@HttpAdapter()
@Assemblage()
class MyAdapter implements AbstractHttpAdapter {
  // implement registerRoute(), listen(), close(), listening, …
}
```

## HTTPS / TLS

Both adapters accept an optional `HttpAdapterConfiguration` as the **third element** of the DI tuple. Pass it to enable TLS — the configuration is injected at construction time via AssemblerJS's `@Configuration()` mechanism.

```typescript
import { readFileSync } from 'node:fs';
import { AbstractHttpAdapter, HttpAdapterConfiguration } from '@assemblerjs/rest';
import { ExpressAdapter } from '@assemblerjs/rest/express';   // or FastifyAdapter
import { Assemblage, Assembler } from 'assemblerjs';

const tlsConfig: HttpAdapterConfiguration = {
  tls: {
    key:  readFileSync('server.key'),
    cert: readFileSync('server.crt'),
  },
};

@Assemblage({
  provide: [
    [AbstractHttpAdapter, ExpressAdapter, tlsConfig],
    [MyController],
  ],
})
class App implements AbstractAssemblage {
  constructor(
    private server: AbstractHttpAdapter,
    private ctrl: MyController,
    @Dispose() private dispose: () => void
  ) {}

  public onInited(): void {
    this.server.listen(443, '0.0.0.0');
  }
}

Assembler.build(App);
```

`tls` accepts any option from Node.js's `https.ServerOptions` (e.g. `ca`, `passphrase`, `requestCert`, …). The same object shape works for both `ExpressAdapter` and `FastifyAdapter`.

## Decorators

### `@Controller({ path })`

Define a REST controller and its base path:

```typescript
@Controller({ path: '/api/users' })
@Assemblage()
class UserController implements AbstractAssemblage { ... }
```

Controllers can be nested by injecting sub-controllers — their paths are composed automatically:

```typescript
@Controller({ path: '/api' })
@Assemblage({
  provide: [[UserController], [PostController]],
})
class ApiController implements AbstractAssemblage {
  constructor(
    public users: UserController,   // path becomes /api/user
    public posts: PostController,   // path becomes /api/post
  ) {}
}
```

### HTTP Method Decorators

| Decorator | HTTP method |
|---|---|
| `@Get(path?)` | GET |
| `@Post(path?)` | POST |
| `@Put(path?)` | PUT |
| `@Patch(path?)` | PATCH |
| `@Delete(path?)` | DELETE |
| `@Head(path?)` | HEAD |
| `@Options(path?)` | OPTIONS |
| `@All(path?)` | All methods |

```typescript
@Get('/:id')
getUser(@Param('id') id: string) { ... }

@Post()
@HttpStatus(201)
createUser(@Body() data: CreateUserDto) { ... }
```

### Parameter Decorators

| Decorator | Description |
|---|---|
| `@Body()` | Full request body |
| `@Param(name)` | Single URL parameter |
| `@Params()` | All URL parameters as object |
| `@Query(name)` | Single query string value |
| `@Queries()` | All query parameters as object |
| `@Header(name)` | Single request header |
| `@Headers()` | All request headers as object |
| `@Cookie(name)` | Single cookie value |
| `@Cookies()` | All cookies as object |
| `@Req()` | Raw `HttpRequest` |
| `@Res()` | Raw `HttpResponse` |

```typescript
@Get('/:id')
getById(
  @Param('id') id: string,
  @Query('lang') lang: string,
  @Header('authorization') auth: string,
) { ... }
```

### Response Decorators

```typescript
// Override the default HTTP status code
@Post()
@HttpStatus(201)
create(@Body() data: any) { ... }

// Redirect
@Get('/old-path')
@Redirect('/new-path', 301)
redirect() {}

// Set custom response headers
@Get()
@HttpHeaders({ 'X-Powered-By': 'My App' })
getData() { ... }
```

### Middleware Decorators

```typescript
import { BeforeMiddleware, AfterMiddleware, Middleware } from '@assemblerjs/rest';

@Controller({ path: '/users' })
@Assemblage()
class UserController implements AbstractAssemblage {
  // Runs before the handler, scoped to this route only
  @Get('/profile')
  @BeforeMiddleware(authMiddleware)
  profile() { ... }

  // Runs after the handler
  @Get('/log')
  @AfterMiddleware(loggingMiddleware)
  getData() { ... }
}
```

## DTO Validation

Use with `@assemblerjs/dto` for automatic request body validation:

```typescript
import { DTO } from '@assemblerjs/dto';
import { IsString, IsEmail, MinLength } from 'class-validator';

@DTO()
class CreateUserDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsEmail()
  email: string;
}

@Controller({ path: '/users' })
@Assemblage()
class UserController implements AbstractAssemblage {
  @Post()
  @HttpStatus(201)
  async createUser(@Body() data: CreateUserDto) {
    // data is validated — a 400 is returned automatically on failure
    return data;
  }
}
```

## Error Handling

Throw one of the built-in error classes from any handler — the framework serializes and sends the correct status automatically:

```typescript
import {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  InternalServerError,
} from '@assemblerjs/rest';

@Controller({ path: '/users' })
@Assemblage()
class UserController implements AbstractAssemblage {
  @Get('/:id')
  getUser(@Param('id') id: string) {
    const user = this.db.find(id);
    if (!user) throw new NotFoundError(`User ${id} not found`);
    return user;
  }
}
```

All error classes extend `GenericError` which exposes a `status: number` property.

## Custom Response Serializers

Add serializers to handle response types beyond the defaults:

```typescript
import { ControllerService } from '@assemblerjs/rest';
import type { ResponseSerializer } from '@assemblerjs/rest';

class XmlSerializer implements ResponseSerializer {
  canHandle(result: unknown): boolean {
    return result instanceof XmlDocument;
  }
  serialize(result: XmlDocument, res: HttpResponse): void {
    res.setHeader('Content-Type', 'application/xml');
    res.send(result.toString());
  }
}

ControllerService.addSerializer(new XmlSerializer());
```

## Full Application Example

### With `ExpressAdapter`

```typescript
import 'reflect-metadata';
import { Assemblage, Assembler, AbstractAssemblage, Dispose } from 'assemblerjs';
import {
  AbstractHttpAdapter,
  Controller,
  Get, Post, Put, Delete,
  Body, Param,
  HttpStatus,
  NotFoundError,
} from '@assemblerjs/rest';
import { ExpressAdapter } from '@assemblerjs/rest/express';

@Assemblage()
class UserService implements AbstractAssemblage {
  private users: { id: number; name: string }[] = [];
  private next = 1;

  findAll() { return this.users; }
  findById(id: number) { return this.users.find((u) => u.id === id) ?? null; }
  create(data: { name: string }) {
    const user = { id: this.next++, ...data };
    this.users.push(user);
    return user;
  }
  update(id: number, data: Partial<{ name: string }>) {
    const user = this.findById(id);
    if (!user) return null;
    Object.assign(user, data);
    return user;
  }
  remove(id: number) {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    return this.users.splice(idx, 1)[0];
  }
}

@Controller({ path: '/users' })
@Assemblage({ provide: [[UserService]] })
class UserController implements AbstractAssemblage {
  constructor(private service: UserService) {}

  @Get()
  getAll() { return this.service.findAll(); }

  @Get('/:id')
  getOne(@Param('id') id: string) {
    const user = this.service.findById(Number(id));
    if (!user) throw new NotFoundError(`User ${id} not found`);
    return user;
  }

  @Post()
  @HttpStatus(201)
  create(@Body() data: { name: string }) {
    return this.service.create(data);
  }

  @Put('/:id')
  update(@Param('id') id: string, @Body() data: { name: string }) {
    const user = this.service.update(Number(id), data);
    if (!user) throw new NotFoundError(`User ${id} not found`);
    return user;
  }

  @Delete('/:id')
  remove(@Param('id') id: string) {
    const user = this.service.remove(Number(id));
    if (!user) throw new NotFoundError(`User ${id} not found`);
    return user;
  }
}

@Assemblage({
  provide: [[AbstractHttpAdapter, ExpressAdapter], [UserController]],
})
class App implements AbstractAssemblage {
  constructor(
    private server: AbstractHttpAdapter,
    private users: UserController,
    @Dispose() private dispose: () => void
  ) {}

  public onInited(): void {
    this.server.listen(3000);
    console.log('Server running on http://localhost:3000');
  }
}

Assembler.build(App);
```

### With `FastifyAdapter`

Replace the adapter import and make `onInited` async:

```typescript
import { FastifyAdapter } from '@assemblerjs/rest/fastify';

@Assemblage({
  provide: [[AbstractHttpAdapter, FastifyAdapter], [UserController]],
})
class App implements AbstractAssemblage {
  constructor(
    private server: AbstractHttpAdapter,
    private users: UserController,
    @Dispose() private dispose: () => void
  ) {}

  public async onInited(): Promise<void> {
    await this.server.listen(3000);
    console.log('Server running on http://localhost:3000');
  }
}
```

## Requirements

- **Node.js:** ≥ 18.12.0
- **Express:** ≥ 5.0 (if using `ExpressAdapter`)
- **Fastify:** ≥ 5.0 (if using `FastifyAdapter`)
- **TypeScript:** ≥ 5.0
- **reflect-metadata:** Required

## TypeScript Configuration

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"]
  }
}
```

## For Contributors

```bash
# Build the package
npx nx build assemblerjs-rest

# Run tests
npx nx test assemblerjs-rest
```

## License

MIT

---

Part of the [AssemblerJS monorepo](../../README.md)


