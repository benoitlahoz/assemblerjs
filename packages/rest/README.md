# @assemblerjs/rest

REST framework for AssemblerJS with Express.js integration and type-safe decorators for controllers, routes, middleware, and request handling.

## Overview

`@assemblerjs/rest` provides a declarative way to build REST APIs using Express.js with AssemblerJS. It offers decorators for controllers, routes, middleware, and request handling, bringing NestJS-like patterns to Express with full TypeScript support.

## Features

- 🎯 **Controller Decorators** - Define REST controllers declaratively
- 🛣️ **Route Decorators** - `@Get`, `@Post`, `@Put`, `@Patch`, `@Delete`
- 📦 **Parameter Decorators** - `@Body`, `@Param`, `@Query`, `@Headers`, `@Req`, `@Res`
- 🔌 **Middleware Support** - Apply middleware with decorators
- ✅ **DTO Integration** - Works with `@assemblerjs/dto` for validation
- 🏗️ **AssemblerJS DI** - Full dependency injection support
- 🔒 **Type-Safe** - Complete TypeScript support

## Installation

```bash
npm install @assemblerjs/rest assemblerjs express reflect-metadata
# or
yarn add @assemblerjs/rest assemblerjs express reflect-metadata
```

```bash
# Optional: for DTO validation
npm install @assemblerjs/dto class-validator class-transformer
```

## Quick Start

```typescript
import 'reflect-metadata';
import express from 'express';
import { Assemblage, Assembler, AbstractAssemblage } from 'assemblerjs';
import { Controller, Get, Post, Body, Param } from '@assemblerjs/rest';

// Define a controller
@Controller('/users')
class UserController {
  @Get()
  getUsers() {
    return [
      { id: '1', name: 'John Doe' },
      { id: '2', name: 'Jane Smith' }
    ];
  }

  @Get('/:id')
  getUser(@Param('id') id: string) {
    return { id, name: 'John Doe' };
  }

  @Post()
  createUser(@Body() data: any) {
    return { id: '3', ...data };
  }
}

// Bootstrap Express app with AssemblerJS
@Assemblage({
  inject: [[UserController]]
})
class App implements AbstractAssemblage {
  private app = express();

  constructor(private userController: UserController) {
    this.app.use(express.json());
  }

  async onInit() {
    this.app.listen(3000, () => {
      console.log('✓ Server running on http://localhost:3000');
    });
  }
}

const app = Assembler.build(App);
```

## Decorators

### `@Controller(basePath, options?)`

Define a REST controller:

```typescript
@Controller('/api/users')
class UserController {
  // Routes here
}

// With options
@Controller('/api/users', {
  middleware: [authMiddleware, loggingMiddleware]
})
class UserController {
  // Routes here
}
```

### HTTP Method Decorators

#### `@Get(path?)`

```typescript
@Get()
getAllUsers() {
  return [];
}

@Get('/:id')
getUser(@Param('id') id: string) {
  return { id };
}
```

#### `@Post(path?)`

```typescript
@Post()
createUser(@Body() data: CreateUserDto) {
  return { id: '123', ...data };
}
```

#### `@Put(path?)` / `@Patch(path?)`

```typescript
@Put('/:id')
updateUser(@Param('id') id: string, @Body() data: UpdateUserDto) {
  return { id, ...data };
}

@Patch('/:id')
partialUpdate(@Param('id') id: string, @Body() data: Partial<UpdateUserDto>) {
  return { id, ...data };
}
```

#### `@Delete(path?)`

```typescript
@Delete('/:id')
deleteUser(@Param('id') id: string) {
  return { success: true, id };
}
```

### Parameter Decorators

#### `@Body()`

Extract request body:

```typescript
@Post()
create(@Body() data: CreateDto) {
  return data;
}
```

#### `@Param(name?)`

Extract URL parameters:

```typescript
@Get('/:id')
getById(@Param('id') id: string) {
  return { id };
}

// Multiple params
@Get('/:userId/posts/:postId')
getUserPost(
  @Param('userId') userId: string,
  @Param('postId') postId: string
) {
  return { userId, postId };
}
```

#### `@Query(name?)`

Extract query parameters:

```typescript
@Get()
search(
  @Query('q') query: string,
  @Query('page') page: number = 1,
  @Query('limit') limit: number = 10
) {
  return { query, page, limit };
}
```

#### `@Headers(name?)`

Extract headers:

```typescript
@Get()
getData(@Headers('authorization') auth: string) {
  return { auth };
}
```

#### `@Req()` / `@Res()`

Access Express request/response:

```typescript
@Get()
manual(@Req() req: Request, @Res() res: Response) {
  res.json({ method: req.method });
}
```

## Integration with DTO

Use with `@assemblerjs/dto` for validation:

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

@Controller('/users')
class UserController {
  @Post()
  async createUser(@Body() data: CreateUserDto) {
    // data is validated automatically
    return { id: '123', ...data };
  }
}
```

## Middleware

### Controller-level Middleware

```typescript
const loggingMiddleware = (req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
};

@Controller('/users', {
  middleware: [loggingMiddleware]
})
class UserController {
  // All routes use this middleware
}
```

### Route-level Middleware

```typescript
import { UseMiddleware } from '@assemblerjs/rest';

const authMiddleware = (req, res, next) => {
  // Check authentication
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

@Controller('/users')
class UserController {
  @Get()
  public() {
    return { message: 'Public route' };
  }

  @Get('/profile')
  @UseMiddleware(authMiddleware)
  profile() {
    return { message: 'Protected route' };
  }
}
```

## Dependency Injection

Use AssemblerJS DI in controllers:

```typescript
@Assemblage()
class UserService implements AbstractAssemblage {
  async findAll() {
    return []; // fetch from DB
  }

  async findById(id: string) {
    return { id }; // fetch from DB
  }

  async create(data: any) {
    return { id: '123', ...data }; // save to DB
  }
}

@Controller('/users')
@Assemblage({
  inject: [[UserService]]
})
class UserController implements AbstractAssemblage {
  constructor(private userService: UserService) {}

  @Get()
  async getUsers() {
    return this.userService.findAll();
  }

  @Get('/:id')
  async getUser(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Post()
  async createUser(@Body() data: CreateUserDto) {
    return this.userService.create(data);
  }
}
```

## Error Handling

```typescript
import { HttpException } from '@assemblerjs/rest';

@Controller('/users')
class UserController {
  @Get('/:id')
  async getUser(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    
    if (!user) {
      throw new HttpException('User not found', 404);
    }
    
    return user;
  }
}

// Global error handler
app.use((err, req, res, next) => {
  if (err instanceof HttpException) {
    return res.status(err.status).json({
      statusCode: err.status,
      message: err.message
    });
  }
  
  res.status(500).json({
    statusCode: 500,
    message: 'Internal server error'
  });
});
```

## Full Application Example

```typescript
import 'reflect-metadata';
import express from 'express';
import { Assemblage, Assembler, AbstractAssemblage } from 'assemblerjs';
import { Controller, Get, Post, Put, Delete, Body, Param } from '@assemblerjs/rest';

// Database service
@Assemblage()
class Database implements AbstractAssemblage {
  private users = new Map();

  findAll() {
    return Array.from(this.users.values());
  }

  findById(id: string) {
    return this.users.get(id);
  }

  create(data: any) {
    const id = Date.now().toString();
    const user = { id, ...data };
    this.users.set(id, user);
    return user;
  }

  update(id: string, data: any) {
    const user = this.users.get(id);
    if (!user) return null;
    const updated = { ...user, ...data };
    this.users.set(id, updated);
    return updated;
  }

  delete(id: string) {
    return this.users.delete(id);
  }
}

// Controller
@Controller('/api/users')
@Assemblage({
  inject: [[Database]]
})
class UserController implements AbstractAssemblage {
  constructor(private db: Database) {}

  @Get()
  getUsers() {
    return this.db.findAll();
  }

  @Get('/:id')
  getUser(@Param('id') id: string) {
    const user = this.db.findById(id);
    if (!user) throw new HttpException('User not found', 404);
    return user;
  }

  @Post()
  createUser(@Body() data: any) {
    return this.db.create(data);
  }

  @Put('/:id')
  updateUser(@Param('id') id: string, @Body() data: any) {
    const user = this.db.update(id, data);
    if (!user) throw new HttpException('User not found', 404);
    return user;
  }

  @Delete('/:id')
  deleteUser(@Param('id') id: string) {
    const deleted = this.db.delete(id);
    if (!deleted) throw new HttpException('User not found', 404);
    return { success: true };
  }
}

// Application
@Assemblage({
  inject: [[UserController]]
})
class RestApp implements AbstractAssemblage {
  private app = express();

  constructor(private controller: UserController) {
    this.app.use(express.json());
  }

  async onInit() {
    this.app.listen(3000, () => {
      console.log('✓ Server running on http://localhost:3000');
    });
  }
}

const app = Assembler.build(RestApp);
```

## Requirements

- **Node.js:** ≥ 18.12.0
- **Express:** ≥ 5.0
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

### Development

```bash
# Build the package
npx nx build rest

# Run tests
npx nx test rest

# E2E tests
npx nx e2e-basic-controller rest
```

## License

MIT

---

Part of the [AssemblerJS monorepo](../../README.md)
