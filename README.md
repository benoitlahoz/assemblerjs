# AssemblerJS Monorepo

<div align="center">

![Assembler Building](https://img.shields.io/badge/assembler%20building-156k%20ops%2Fsec-brightgreen.svg?style=flat)
![Injectable Resolution](https://img.shields.io/badge/singleton%20cache-1.2M%20ops%2Fsec-brightgreen.svg?style=flat)
![Event System](https://img.shields.io/badge/event%20emit-432k%20ops%2Fsec-brightgreen.svg?style=flat)
![Decorators](https://img.shields.io/badge/decorators-890k%20ops%2Fsec-brightgreen.svg?style=flat)

![Statements](https://img.shields.io/badge/statements-91.01%25-brightgreen.svg?style=flat) ![Branches](https://img.shields.io/badge/branches-79.6%25-red.svg?style=flat) ![Functions](https://img.shields.io/badge/functions-87.62%25-yellow.svg?style=flat) ![Lines](https://img.shields.io/badge/lines-90.76%25-brightgreen.svg?style=flat)

**A modern, type-safe, and lightweight ecosystem for building scalable TypeScript applications**

[Documentation](./docs/assemblerjs/index.md) • [Quick Start](#quick-start) • [Packages](#packages) • [Examples](#examples)

</div>

---

## 🌟 Purpose

**AssemblerJS** is a complete ecosystem for building modular and type-safe TypeScript applications. The monorepo provides:

- 🎯 **assemblerjs** - A modern dependency injection system with lifecycle hooks and events
- 🌐 **@assemblerjs/rest** - REST framework with Express.js decorators
- 📦 **@assemblerjs/dto** - DTO validation and transformation with class-validator
- 🔌 **@assemblerjs/electron** - Electron integration with type-safe IPC
- 🌐 **@assemblerjs/fetch** - HTTP decorators for fetch requests
- 🗄️ **@assemblerjs/mongo** - MongoDB integration with Mongoose

Inspired by [DIOD](https://github.com/artberri/diod) and [NestJS](https://nestjs.com/), the name **AssemblerJS** pays tribute to Gilles Deleuze and Felix Guattari's concept of [_Agencement_](<https://fr.wikipedia.org/wiki/Agencement_(philosophie)>), translated in English as [Assemblage](<https://en.wikipedia.org/wiki/Assemblage_(philosophy)>).

---

## 🚀 Quick Start

### Installation

```bash
npm install assemblerjs reflect-metadata
# or
yarn add assemblerjs reflect-metadata
```

### Basic Example

```typescript
import 'reflect-metadata';
import { Assemblage, Assembler, AbstractAssemblage } from 'assemblerjs';

// Define a service
@Assemblage()
class Logger implements AbstractAssemblage {
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }
}

// Define a service that depends on Logger
@Assemblage({
  inject: [[Logger]], // Declare dependencies
})
class UserService implements AbstractAssemblage {
  constructor(private logger: Logger) {}

  getUser(id: string) {
    this.logger.log(`Fetching user ${id}`);
    return { id, name: 'John Doe' };
  }
}

// Define an application
@Assemblage({
  inject: [[UserService]],
})
class App implements AbstractAssemblage {
  constructor(private userService: UserService) {}

  async onInit() {
    const user = this.userService.getUser('123');
    console.log(user);
  }
}

// Bootstrap the application
const app = Assembler.build(App);
// Output: "[LOG] Fetching user 123"
// Output: "{ id: '123', name: 'John Doe' }"
```

---

## 📦 Packages

### Core Package

#### [**assemblerjs**](./packages/assemblerjs) 
The core dependency injection system with support for lifecycle hooks, events, and tags.

**Features:**
- Type-safe dependency injection with decorators
- Lifecycle hooks (`onRegister`, `onInit`, `onDispose`)
- Built-in event system
- Singleton & Transient scopes
- Custom decorators
- Tree-shakable (~5-35 KB depending on usage)

[📖 Documentation complète](./docs/assemblerjs/) • [README](./packages/assemblerjs/README.md)

---

### Integration Packages

#### [**@assemblerjs/rest**](./packages/rest)
REST framework for Express.js with type-safe decorators for controllers, routes, and middleware.

**Use case:** Create REST APIs with Express.js in a declarative way

```typescript
import { Controller, Get, Post, Body } from '@assemblerjs/rest';

@Controller('/users')
class UserController {
  @Get('/:id')
  getUser(@Param('id') id: string) {
    return { id, name: 'John' };
  }

  @Post()
  createUser(@Body() data: CreateUserDto) {
    return { id: '123', ...data };
  }
}
```

[README](./packages/rest/README.md)

---

#### [**@assemblerjs/fetch**](./packages/fetch)
HTTP decorators to simplify fetch calls with parameters, queries, and automatic parsing.

**Use case:** Create declarative HTTP clients

```typescript
import { Fetch, Query, Param, Parse } from '@assemblerjs/fetch';

class UserApiClient {
  @Fetch('get', 'https://api.example.com/users')
  @Parse('json')
  async getUsers(
    @Query('limit') limit: number,
    @Query('skip') skip: number,
    data?: any
  ) {
    return data;
  }

  @Fetch('get', 'https://api.example.com/users/:id')
  async getUser(@Param('id') id: string, data?: any) {
    return data;
  }
}
```

[📖 README complet](./packages/fetch/README.md)

---

#### [**@assemblerjs/electron**](./packages/electron)
Electron integration with type-safe IPC between main process, renderer, and preload.

**Use case:** Build Electron applications with AssemblerJS

[README](./packages/electron/README.md)

---

#### [**@assemblerjs/mongo**](./packages/mongo)
MongoDB integration with Mongoose and decorators to define schemas and models.

**Use case:** Work with MongoDB in AssemblerJS

```typescript
import { Schema, Prop, Model } from '@assemblerjs/mongo';

@Schema()
class User {
  @Prop({ required: true })
  name: string;

  @Prop()
  email: string;
}

const UserModel = Model(User);
```

[README](./packages/mongo/README.md)

---

#### [**@assemblerjs/dto**](./packages/dto)
DTO validation and transformation using class-validator and class-transformer.

**Use case:** Validate and transform data transfer objects

```typescript
import { DTO } from '@assemblerjs/dto';
import { IsString, IsEmail } from 'class-validator';

@DTO()
class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;
}
```

[README](./packages/dto/README.md)

---

### Internal Package

#### [**@assemblerjs/core**](./packages/core)
Shared internal utilities (types, collections, errors). Automatically installed with `assemblerjs`.

[README](./packages/core/README.md)

---

## 💡 Examples

### Lifecycle Hooks

```typescript
@Assemblage()
class DatabaseService implements AbstractAssemblage {
  private connection: any;

  // Called when registering (static)
  static onRegister(context: AssemblerContext) {
    console.log('DatabaseService registered');
  }

  // Called when instance is ready
  async onInit() {
    this.connection = await connectToDatabase();
    console.log('Database connected');
  }

  // Called on cleanup
  async onDispose() {
    await this.connection.close();
    console.log('Database disconnected');
  }
}
```

### Event System

```typescript
import { EventManager, Assemblage, Context, AssemblerContext } from 'assemblerjs';

const Events = {
  USER_CREATED: 'app:user:created',
};

@Assemblage({
  events: Object.values(Events), // Register events
})
class UserService extends EventManager {
  createUser(name: string) {
    const user = { id: '123', name };
    this.emit(Events.USER_CREATED, user); // Emit event
    return user;
  }
}

@Assemblage({
  inject: [[UserService]],
})
class NotificationService {
  constructor(
    private userService: UserService,
    @Context() private context: AssemblerContext
  ) {
    // Subscribe to events via context
    this.context.on(Events.USER_CREATED, (user) => {
      console.log(`Welcome ${user.name}!`);
    });
  }
}
```

### Custom Decorators

```typescript
import { ParameterDecoratorFactory } from 'assemblerjs';

// Create a custom parameter decorator
const CurrentUser = ParameterDecoratorFactory((context, args) => {
  return { id: '123', name: 'John' }; // Resolve current user
});

@Assemblage()
class UserController {
  getProfile(@CurrentUser() user: User) {
    return user;
  }
}
```

### Tags & Discovery

```typescript
@Assemblage({ tags: ['plugin', 'logger'] })
class ConsoleLogger implements AbstractAssemblage {
  log(msg: string) { console.log(msg); }
}

@Assemblage({ tags: ['plugin', 'logger'] })
class FileLogger implements AbstractAssemblage {
  log(msg: string) { /* write to file */ }
}

@Assemblage()
class App {
  @Context() context!: AssemblerContext;

  onInit() {
    // Get all loggers
    const loggers = this.context.getByTag<AbstractAssemblage>('logger');
    loggers.forEach(logger => logger.log('Hello'));
  }
}
```

### Full Application Example

```typescript
import 'reflect-metadata';
import { Assemblage, Assembler, AbstractAssemblage, Context, AssemblerContext } from 'assemblerjs';

// Configuration
@Assemblage()
class Config implements AbstractAssemblage {
  readonly apiUrl = 'https://api.example.com';
  readonly port = 3000;
}

// Database Service
@Assemblage()
class Database implements AbstractAssemblage {
  private connection: any;

  async onInit() {
    this.connection = await this.connect();
    console.log('✓ Database connected');
  }

  async onDispose() {
    await this.connection?.close();
    console.log('✓ Database disconnected');
  }

  private async connect() {
    // Connect to database
    return { /* connection */ };
  }

  async query(sql: string) {
    return this.connection.query(sql);
  }
}

// User Repository
@Assemblage({
  inject: [[Database]],
})
class UserRepository implements AbstractAssemblage {
  constructor(private db: Database) {}

  async findById(id: string) {
    return this.db.query(`SELECT * FROM users WHERE id = ${id}`);
  }

  async create(data: any) {
    return this.db.query(`INSERT INTO users ...`);
  }
}

// User Service with Events
@Assemblage({
  inject: [[UserRepository]],
  events: ['app:user:created'],
})
class UserService extends EventManager {
  constructor(private userRepo: UserRepository) {
    super();
  }

  async createUser(data: any) {
    const user = await this.userRepo.create(data);
    this.emit('app:user:created', user);
    return user;
  }
}

// Application
@Assemblage({
  inject: [[Config, UserService]],
})
class App implements AbstractAssemblage {
  constructor(
    private config: Config,
    private userService: UserService,
    @Context() private context: AssemblerContext
  ) {
    // Subscribe to events
    this.context.on('app:user:created', (user) => {
      console.log('New user created:', user);
    });
  }

  async onInit() {
    console.log(`✓ App started on port ${this.config.port}`);
    
    // Create a user
    await this.userService.createUser({
      name: 'John Doe',
      email: 'john@example.com'
    });
  }

  @Dispose()
  async shutdown(dispose: () => Promise<void>) {
    console.log('Shutting down...');
    await dispose(); // Calls onDispose on all assemblages
  }
}

// Bootstrap
const app = Assembler.build(App);
```

---

## 📖 Documentation

Comprehensive documentation is available in the [docs](./docs/assemblerjs/) directory:

- **Getting Started**
  - [Installation](./docs/assemblerjs/getting-started/installation.md)
  - [Quick Start](./docs/assemblerjs/getting-started/quick-start.md)
  - [TypeScript Setup](./docs/assemblerjs/getting-started/typescript-setup.md)

- **Core Concepts**
  - [Assemblage](./docs/assemblerjs/core-concepts/assemblage.md)
  - [Dependency Injection](./docs/assemblerjs/core-concepts/dependency-injection.md)
  - [Abstraction Pattern](./docs/assemblerjs/core-concepts/abstraction-pattern.md)
  - [Lifecycle Hooks](./docs/assemblerjs/core-concepts/lifecycle-hooks.md)

- **Features**
  - [Event System](./docs/assemblerjs/features/events.md)
  - [Tags](./docs/assemblerjs/features/tags.md)
  - [Singleton vs Transient](./docs/assemblerjs/features/singleton-transient.md)

- **API Reference**
  - [Assembler API](./docs/assemblerjs/api/assembler.md)
  - [AssemblerContext API](./docs/assemblerjs/api/context.md)
  - [Types](./docs/assemblerjs/api/types.md)

---

## 🏗️ Monorepo Structure

```
assemblerjs/
├── packages/
│   ├── assemblerjs/       # Core DI library
│   ├── core/              # Internal utilities
│   ├── dto/               # DTO validation
│   ├── electron/          # Electron integration
│   ├── fetch/             # HTTP decorators
│   ├── mongo/             # MongoDB integration
│   └── rest/              # REST framework
├── docs/                  # Documentation
└── README.md              # This file
```

---

## 🛠️ Development

This monorepo uses [Nx](https://nx.dev) for build orchestration and [Yarn](https://yarnpkg.com/) as package manager.

### Prerequisites

- Node.js ≥ 18.12.0
- Yarn ≥ 1.22.0

### Setup

```bash
# Install dependencies
yarn install

# Build all packages
npx nx run-many -t build

# Test all packages
npx nx run-many -t test

# Build specific package
npx nx build assemblerjs

# Test specific package
npx nx test assemblerjs
```

---

## 📊 Performance

AssemblerJS is optimized for performance:

- **Assembler Building:** 156k ops/sec
- **Singleton Cache:** 1.2M ops/sec
- **Event Emission:** 432k ops/sec
- **Decorators:** 890k ops/sec

[View Full Benchmarks](./docs/assemblerjs/performance/benchmarks.md)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT

---

## 🙏 Acknowledgments

- Inspired by [DIOD](https://github.com/artberri/diod) and [NestJS](https://nestjs.com/)
- Philosophical concept from Gilles Deleuze and Felix Guattari's [_Agencement_](<https://fr.wikipedia.org/wiki/Agencement_(philosophie)>)

---

**Made with ❤️ in Marseille**
