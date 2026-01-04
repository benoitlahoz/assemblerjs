# assembler.js

A modern, type-safe, and lightweight [Dependency Injection](https://en.wikipedia.org/wiki/Dependency_injection) library for Node.js and browsers.

![Statements](https://img.shields.io/badge/statements-91.01%25-brightgreen.svg?style=flat) ![Branches](https://img.shields.io/badge/branches-79.6%25-red.svg?style=flat) ![Functions](https://img.shields.io/badge/functions-87.62%25-yellow.svg?style=flat) ![Lines](https://img.shields.io/badge/lines-90.76%25-brightgreen.svg?style=flat)

---

## Features

- 🎯 **Minimal Dependencies** - Only requires `reflect-metadata`
- 🔒 **Type-Safe** - Full TypeScript support with generics
- 🌳 **Tree-Shakable** - Optimized bundle size (~5-6 KB for minimal usage)
- ♻️ **Lifecycle Hooks** - `onRegister`, `onInit`, `onDispose`
- 📡 **Built-in Event System** - Integrated EventManager
- 🎨 **Custom Decorators** - Easy creation with `ParameterDecoratorFactory`
- 🔧 **Flexible Configuration** - Runtime configuration override
- 🏷️ **Tags Support** - Group and retrieve dependencies by tags
- 🌐 **Universal** - Works in Node.js and browsers
- �� **Singleton & Transient** - Control instance lifecycle

Inspired by [DIOD](https://github.com/artberri/diod) and [NestJS](https://nestjs.com/).

## Installation

```sh
npm install assemblerjs reflect-metadata
```

```sh
yarn add assemblerjs reflect-metadata
```

**Important:** You must import `reflect-metadata` at the entry point of your application:

```typescript
import 'reflect-metadata';
```

## Quick Start

```typescript
import 'reflect-metadata';
import { Assemblage, Assembler, AbstractAssemblage } from 'assemblerjs';

// Define a service
@Assemblage()
class Logger implements AbstractAssemblage {
  log(message: string) {
    console.log(message);
  }
}

// Define an application that depends on Logger
@Assemblage({
  inject: [[Logger]], // Declare dependencies
})
class App implements AbstractAssemblage {
  constructor(private logger: Logger) {}

  start() {
    this.logger.log('App started!');
  }
}

// Bootstrap the application
const app = Assembler.build(App);
app.start(); // Output: "App started!"
```

## Core Concepts

### Assemblage

The main building block of `assembler.js`. An **Assemblage** is a class decorated with `@Assemblage` that can be injected as a dependency. Classes should implement `AbstractAssemblage` for type safety.

```typescript
@Assemblage({
  singleton: true, // Default: true
  inject: [],      // Dependencies to inject
  use: [],         // Objects/instances to register
  tags: [],        // Tags for grouping
  events: [],      // Event channels to register
  metadata: {},    // Custom metadata
  global: {},      // Global values
})
export class MyService implements AbstractAssemblage {
  // Your service implementation
}
```

### Dependency Injection

Dependencies are declared in the `inject` property and injected via constructor:

```typescript
@Assemblage({
  inject: [
    [ConcreteClass],                              // Simple injection
    [AbstractClass, ConcreteClass],               // Interface binding
    [AbstractClass, ConcreteClass, { config }],   // With configuration
  ],
})
class MyApp implements AbstractAssemblage {
  constructor(
    private service: ConcreteClass,
    private abstraction: AbstractClass
  ) {}
}
```

### Abstraction Pattern

`assembler.js` supports the abstraction pattern, allowing you to define interfaces (abstract classes) and swap implementations easily:

```typescript
// 1. Define an abstract class that implements AbstractAssemblage
abstract class AbstractLogger implements AbstractAssemblage {
  abstract log(message: string): void;
  abstract error(message: string): void;
}

// 2. Create concrete implementations
@Assemblage()
class ConsoleLogger implements AbstractLogger {
  log(message: string) {
    console.log(`[LOG] \${message}`);
  }
  
  error(message: string) {
    console.error(`[ERROR] \${message}`);
  }
}

@Assemblage()
class FileLogger implements AbstractLogger {
  log(message: string) {
    // Write to file
  }
  
  error(message: string) {
    // Write error to file
  }
}

// 3. Use the abstraction, not the concrete class
@Assemblage({
  inject: [
    [AbstractLogger, ConsoleLogger], // Bind abstraction to implementation
  ],
})
class Application implements AbstractAssemblage {
  constructor(private logger: AbstractLogger) {
    // You can now easily swap ConsoleLogger with FileLogger
    // without changing Application code
  }
  
  start() {
    this.logger.log('Application started');
  }
}
```

**Benefits:**
- ✅ **Decoupling** - Your code depends on abstractions, not concrete implementations
- ✅ **Testability** - Easy to mock abstract classes in tests
- ✅ **Flexibility** - Change implementations without modifying dependent code
- ✅ **Type Safety** - TypeScript ensures implementations match the contract

### Singleton vs Transient

```typescript
// Singleton (default) - One instance shared across the application
@Assemblage({ singleton: true })
class SingletonService implements AbstractAssemblage {}

// Transient - New instance created each time it's injected
@Assemblage({ singleton: false })
class TransientService implements AbstractAssemblage {}
```

## Lifecycle Hooks

Dependencies are registered and built recursively from the entry assemblage. The lifecycle follows this order:

### 1. `onRegister` (Static)

Called when the assemblage is registered. Other dependencies may or may not be registered yet.

```typescript
@Assemblage()
class MyService implements AbstractAssemblage {
  static onRegister(context: AssemblerContext, configuration: Record<string, any>) {
    console.log('Service registered');
  }
}
```

### 2. `constructor`

The instance is built with all dependencies injected. Each dependency is resolved according to its singleton/transient setting.

```typescript
@Assemblage({ inject: [[LoggerService]] })
class MyApp implements AbstractAssemblage {
  constructor(private logger: LoggerService) {
    // Dependencies are ready to use
  }
}
```

### 3. `onInit`

Called when the entire dependency tree is ready. Executed bottom-up (dependencies first, entry point last).

```typescript
@Assemblage()
class MyService implements AbstractAssemblage {
  async onInit(context: AssemblerContext, configuration: Record<string, any>) {
    console.log('Service initialized');
    // Perform async initialization here
  }
}
```

### 4. `onDispose`

Called when disposing the assembler. Use for cleanup (closing connections, releasing resources).

```typescript
@Assemblage()
class DatabaseService implements AbstractAssemblage {
  async onDispose(context: AssemblerContext, configuration: Record<string, any>) {
    await this.connection.close();
    console.log('Database connection closed');
  }
}
```

### Execution Order Example

```typescript
@Assemblage()
class ChildService implements AbstractAssemblage {
  static onRegister() { console.log('1. Child registered'); }
  constructor() { console.log('3. Child constructed'); }
  onInit() { console.log('5. Child initialized'); }
  onDispose() { console.log('8. Child disposed'); }
}

@Assemblage({ inject: [[ChildService]] })
class ParentService implements AbstractAssemblage {
  static onRegister() { console.log('2. Parent registered'); }
  constructor(child: ChildService) { console.log('4. Parent constructed'); }
  onInit() { console.log('6. Parent initialized'); }
  onDispose() { console.log('7. Parent disposed'); }
}

const app = Assembler.build(ParentService);
// Triggers onInit

app.dispose();
// Triggers onDispose
```

## Parameter Decorators

`assembler.js` provides several built-in parameter decorators for dependency injection:

### Built-in Decorators

#### `@Context()`

Injects the `AssemblerContext` instance, providing access to the DI container.

```typescript
@Assemblage()
class MyService implements AbstractAssemblage {
  constructor(@Context() private context: AssemblerContext) {
    // Access container methods:
    // - context.require(identifier)
    // - context.has(identifier)
    // - context.tagged(...tags)
    // - context.global(key)
    // - context.on/off/once (events)
  }
}
```

#### `@Configuration()`

Injects the configuration object passed to `Assembler.build()` or defined in the assemblage definition.

```typescript
@Assemblage()
class DatabaseService implements AbstractAssemblage {
  constructor(@Configuration() private config: any) {
    console.log(config.host); // Access configuration
  }
}

// Runtime configuration override
const app = Assembler.build(DatabaseService, { 
  host: 'localhost', 
  port: 5432 
});
```

#### `@Definition()`

Injects the assemblage's definition metadata.

```typescript
@Assemblage({ tags: ['service'], metadata: { version: '1.0' } })
class MyService implements AbstractAssemblage {
  constructor(@Definition() private def: AssemblageDefinition) {
    console.log(def.tags);     // ['service']
    console.log(def.metadata); // { version: '1.0' }
  }
}
```

#### `@Dispose()`

Injects the dispose function to clean up resources programmatically.

```typescript
@Assemblage()
class MyService implements AbstractAssemblage {
  constructor(@Dispose() private dispose: () => void) {}

  cleanup() {
    // Manually trigger disposal
    this.dispose();
  }
}
```

#### `@Use(identifier)`

Injects objects registered with `use` in the assemblage definition.

```typescript
const apiClient = new ApiClient();

@Assemblage({
  use: [['apiClient', apiClient]],
})
class MyService implements AbstractAssemblage {
  constructor(@Use('apiClient') private client: ApiClient) {}
}
```

#### `@Global(identifier)`

Injects global values registered with `global` in the assemblage definition.

```typescript
@Assemblage({
  global: { apiKey: 'secret-key-123' },
})
class ApiService implements AbstractAssemblage {
  constructor(@Global('apiKey') private key: string) {
    console.log(this.key); // 'secret-key-123'
  }
}
```

#### `@Optional()`

Marks a dependency as optional. Returns `undefined` if not registered.

```typescript
@Assemblage()
class MyService implements AbstractAssemblage {
  constructor(@Optional() private logger?: LoggerService) {
    // logger will be undefined if LoggerService is not registered
    this.logger?.log('Service created');
  }
}
```

### Creating Custom Parameter Decorators

The `ParameterDecoratorFactory` makes creating custom decorators effortless:

```typescript
import { ParameterDecoratorFactory, ParameterResolver } from 'assemblerjs';

// 1. Create a resolver
class LoggerResolver implements ParameterResolver {
  resolve(value: string, context: AssemblerContext): any {
    // Return the logger instance for the given name
    return new Logger(value);
  }
}

// 2. Create the decorator (just 5 lines!)
export const Logger = ParameterDecoratorFactory.create<string>({
  name: 'Logger',
  valueType: 'map',
  resolver: LoggerResolver,
});

// 3. Use it in your classes
@Assemblage()
export class MyService implements AbstractAssemblage {
  constructor(@Logger('app') private logger: Logger) {
    this.logger.info('Service created');
  }
}
```

The factory automatically:
- Registers the resolver
- Generates reflection metadata keys
- Handles parameter storage
- Maintains type safety

**ValueType options:**
- `'single'` - Single value per decorator
- `'array'` - Multiple values as array
- `'map'` - Key-value mapping

## Event System

`assembler.js` includes a built-in event system via the `EventManager` class. Any assemblage can extend `EventManager` to emit events.

### Basic Usage

```typescript
import { EventManager, Assemblage, AbstractAssemblage } from 'assemblerjs';

// Define event channels
const Events = {
  USER_CREATED: 'app:user:created',
  USER_DELETED: 'app:user:deleted',
};

@Assemblage({
  events: Object.values(Events), // Register event channels
})
export class UserService 
  extends EventManager 
  implements AbstractAssemblage 
{
  constructor() {
    super(...Object.values(Events)); // Pass allowed channels
  }

  createUser(name: string) {
    const user = { id: 1, name };
    this.emit(Events.USER_CREATED, user); // Emit event
    return user;
  }
}

@Assemblage({ inject: [[UserService]] })
export class NotificationService implements AbstractAssemblage {
  constructor(
    @Context() private context: AssemblerContext,
    private userService: UserService
  ) {
    // Listen to events via context
    context.on(Events.USER_CREATED, (user) => {
      console.log('Send notification for user:', user.name);
    });

    // Listen to all events on wildcard channel
    context.on('*', (data) => {
      console.log('Event received:', data);
    });
  }
}
```

### Event Manager API

```typescript
class EventManager {
  // Add event channels
  addChannels(...channels: string[]): EventManager;
  
  // Remove event channels
  removeChannels(...channels: string[]): EventManager;
  
  // Register event listener
  on(channel: string, callback: Listener): EventManager;
  
  // Register one-time listener
  once(channel: string, callback: Listener): EventManager;
  
  // Remove event listener
  off(channel: string, callback?: Listener): EventManager;
  
  // Emit event (only on registered channels)
  emit(channel: string, ...args: any[]): EventManager;
  
  // Cleanup
  dispose(): void;
}
```

### Event Context Forwarding

All events are automatically forwarded through `AssemblerContext`, allowing any assemblage to listen to events emitted by others:

```typescript
@Assemblage()
class ObserverService implements AbstractAssemblage {
  constructor(@Context() private context: AssemblerContext) {
    // Listen to any registered event channel
    context.on('app:user:created', (user) => {
      // React to event
    });
  }
}
```

### Event Channel Best Practices

To avoid collisions, use strong channel names with namespacing:

```typescript
// ❌ Bad - Too generic
const Events = { INIT: 'init', ERROR: 'error' };

// ✅ Good - Namespaced and specific
const Events = {
  INIT: 'com.myapp.service.user:init',
  ERROR: 'com.myapp.service.user:error',
  CREATED: 'com.myapp.service.user:created',
};
```

## Tags

Tags allow grouping and retrieving assemblages by category:

```typescript
@Assemblage({ tags: ['plugin', 'auth'] })
class AuthPlugin implements AbstractAssemblage {}

@Assemblage({ tags: ['plugin', 'storage'] })
class StoragePlugin implements AbstractAssemblage {}

@Assemblage({ inject: [[AuthPlugin], [StoragePlugin]] })
class PluginManager implements AbstractAssemblage {
  constructor(@Context() private context: AssemblerContext) {
    // Get all plugins
    const plugins = context.tagged('plugin');
    console.log(plugins); // [AuthPlugin instance, StoragePlugin instance]
    
    // Get only auth plugins
    const authPlugins = context.tagged('auth', 'plugin');
    console.log(authPlugins); // [AuthPlugin instance]
  }
}
```

## Assembler API

The `Assembler` class provides static methods for bootstrapping and managing the DI container:

```typescript
import { Assembler } from 'assemblerjs';

// Build and initialize an application
const app = Assembler.build<MyApp>(MyApp, configuration?);

// Get the AssemblerContext (container)
const context = Assembler.context;

// Dispose all resources and cleanup
await app.dispose();
```

## AssemblerContext API

The `AssemblerContext` is the DI container managing all assemblages:

```typescript
class AssemblerContext {
  // Check if an identifier is registered
  has(identifier: Identifier): boolean;
  
  // Require/resolve a dependency
  require<T>(identifier: Identifier<T>): T;
  
  // Get assemblages by tags
  tagged(...tags: string[]): any[];
  
  // Get/set global values
  global<T = any>(identifier: string): T;
  global<T = any>(identifier: string, value: T): void;
  
  // Event methods (inherited from EventManager)
  on(channel: string, callback: Listener): AssemblerContext;
  once(channel: string, callback: Listener): AssemblerContext;
  off(channel: string, callback?: Listener): AssemblerContext;
  
  // Get all registered identifiers
  identifiers: Identifier[];
  
  // Get the entry assemblage
  entryAssemblage: any;
}
```

## Advanced Examples

### Multi-Module Application

```typescript
// Database module
@Assemblage({ tags: ['module', 'database'] })
class DatabaseModule implements AbstractAssemblage {
  static onRegister() {
    console.log('Database module registered');
  }
  
  async onInit(@Configuration() config: any) {
    await this.connect(config.dbUrl);
  }
  
  async onDispose() {
    await this.disconnect();
  }
}

// API module
@Assemblage({ 
  tags: ['module', 'api'],
  inject: [[DatabaseModule]],
})
class ApiModule implements AbstractAssemblage {
  constructor(private db: DatabaseModule) {}
  
  getUsers() {
    return this.db.query('SELECT * FROM users');
  }
}

// Application
@Assemblage({
  inject: [[DatabaseModule], [ApiModule]],
  global: { 
    appName: 'MyApp',
    version: '1.0.0',
  },
})
class Application implements AbstractAssemblage {
  constructor(
    @Global('appName') private name: string,
    @Context() private context: AssemblerContext,
    private api: ApiModule
  ) {
    console.log(`Starting \${this.name}`);
  }
  
  async start() {
    const users = await this.api.getUsers();
    console.log('Users:', users);
  }
}

// Bootstrap
const app = Assembler.build(Application, {
  dbUrl: 'postgresql://localhost/mydb',
});

await app.start();
await app.dispose(); // Cleanup
```

### Factory Pattern with Transient

```typescript
// Transient service - new instance each time
@Assemblage({ singleton: false })
class Task implements AbstractAssemblage {
  execute(data: any) {
    // Process task
  }
}

// Factory that creates tasks
@Assemblage({ inject: [[Task]] })
class TaskFactory implements AbstractAssemblage {
  constructor(@Context() private context: AssemblerContext) {}
  
  createTask(): Task {
    // Each call returns a new Task instance
    return this.context.require(Task);
  }
}

@Assemblage({ inject: [[TaskFactory]] })
class TaskRunner implements AbstractAssemblage {
  constructor(private factory: TaskFactory) {}
  
  runMany(count: number) {
    for (let i = 0; i < count; i++) {
      const task = this.factory.createTask();
      task.execute({ id: i });
    }
  }
}
```

### Plugin System with Tags

```typescript
// Define plugin interface
abstract class Plugin {
  abstract name: string;
  abstract init(): void;
}

// Create plugins
@Assemblage({ tags: ['plugin'] })
class LoggerPlugin extends Plugin {
  name = 'Logger';
  init() { console.log('Logger initialized'); }
}

@Assemblage({ tags: ['plugin'] })
class CachePlugin extends Plugin {
  name = 'Cache';
  init() { console.log('Cache initialized'); }
}

// Plugin manager
@Assemblage({
  inject: [[LoggerPlugin], [CachePlugin]],
})
class PluginSystem implements AbstractAssemblage {
  private plugins: Plugin[] = [];
  
  constructor(@Context() private context: AssemblerContext) {}
  
  onInit() {
    // Dynamically load all plugins
    this.plugins = this.context.tagged('plugin');
    this.plugins.forEach(plugin => plugin.init());
  }
  
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.find(p => p.name === name);
  }
}
```

### Abstraction Pattern Example

```typescript
// Define abstractions that implement AbstractAssemblage
abstract class AbstractDataStore implements AbstractAssemblage {
  abstract save(key: string, value: any): Promise<void>;
  abstract load(key: string): Promise<any>;
}

abstract class AbstractCache implements AbstractAssemblage {
  abstract get(key: string): any;
  abstract set(key: string, value: any): void;
}

// Concrete implementations
@Assemblage()
class FileDataStore implements AbstractDataStore {
  async save(key: string, value: any) {
    // Save to file system
  }
  
  async load(key: string) {
    // Load from file system
  }
}

@Assemblage()
class MemoryCache implements AbstractCache {
  private cache = new Map();
  
  get(key: string) {
    return this.cache.get(key);
  }
  
  set(key: string, value: any) {
    this.cache.set(key, value);
  }
}

// Use abstractions
@Assemblage({
  inject: [
    [AbstractDataStore, FileDataStore],
    [AbstractCache, MemoryCache],
  ],
})
class DataService implements AbstractAssemblage {
  constructor(
    private store: AbstractDataStore,  // Type is abstract
    private cache: AbstractCache       // Type is abstract
  ) {}
  
  async getData(key: string) {
    // Try cache first
    let data = this.cache.get(key);
    if (!data) {
      data = await this.store.load(key);
      this.cache.set(key, data);
    }
    return data;
  }
}

// Easy to swap implementations for testing or different environments
@Assemblage({
  inject: [
    [AbstractDataStore, DatabaseStore],  // Swap FileDataStore with DatabaseStore
    [AbstractCache, RedisCache],         // Swap MemoryCache with RedisCache
  ],
})
class ProductionDataService implements AbstractAssemblage {
  constructor(
    private store: AbstractDataStore,
    private cache: AbstractCache
  ) {}
}
```

## Tree-Shaking & Bundle Optimization

`assembler.js` is optimized for tree-shaking with modular exports. Import only what you need:

```typescript
// ❌ Large bundle (imports everything)
import * as Assembler from 'assemblerjs';

// ✅ Optimal (only imports required modules)
import { Assemblage, Assembler, AbstractAssemblage } from 'assemblerjs';
```

### Bundle Size Examples

- **Minimal usage** (~5-6 KB): Core DI features only
- **Medium usage** (~15-18 KB): DI + Events + Parameter decorators
- **Full library** (~35 KB): All features

The package uses:
- ✅ `"sideEffects": false` - Safe to remove unused modules
- ✅ Modular exports - Each feature in separate files
- ✅ ESM format - Native tree-shaking support

## TypeScript Configuration

Enable decorators and reflection in your `tsconfig.json`:

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

## Requirements

- **Node.js:** ≥ 18.12.0
- **TypeScript:** ≥ 5.0 (with decorator support)
- **reflect-metadata:** Required for dependency injection

## For Contributors

### Architecture

This package is part of the `assemblerjs` monorepo and depends on:

- **`@assemblerjs/core`** - Internal utilities package providing:
  - Type utilities and helpers
  - Collection management utilities
  - Error handling utilities
  - Conditional utilities
  - Array manipulation helpers

This dependency is automatically installed with `assemblerjs` and transparent to end users.

### Development

```bash
# Install dependencies from workspace root
yarn install

# Build the package
npx nx build assemblerjs

# Run tests
npx nx test assemblerjs

# Run E2E tests
npx nx test assemblerjs --testPathPattern=e2e
```

### Monorepo Structure

```
assemblerjs/
├── packages/
│   ├── assemblerjs/       # Main DI library (this package)
│   ├── core/              # Internal utilities
│   ├── dto/               # DTO utilities
│   ├── electron/          # Electron integration
│   ├── fetch/             # Fetch utilities
│   ├── mongo/             # MongoDB integration
│   └── rest/              # REST utilities
```

## License

MIT

---

**Made with ❤️ for modern TypeScript applications**
