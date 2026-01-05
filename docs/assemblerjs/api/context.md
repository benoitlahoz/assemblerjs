# AssemblerContext API

The `AssemblerContext` provides access to a subset of the container's methods for dependency management. The actual container is `Assembler`.

## Overview

The `AssemblerContext` interface allows assemblages to:
- Resolve dependencies dynamically
- Check if dependencies are registered
- Retrieve assemblages by tags
- Manage global values
- Listen to and emit events

Access the context via the `@Context()` parameter decorator:

```typescript
@Assemblage()
class MyService implements AbstractAssemblage {
  constructor(@Context() private context: AssemblerContext) {
    // Use context methods
  }
}
```

## Methods

### has(identifier)

Check if an identifier is registered in the container.

```typescript
has(identifier: Identifier): boolean
```

**Example:**

```typescript
if (context.has(DatabaseService)) {
  console.log('Database service is registered');
}
```

### require<T>(identifier)

Resolve and return a dependency.

```typescript
require<T>(identifier: Identifier<T>): T
```

**Example:**

```typescript
const logger = context.require(LoggerService);
logger.log('Message');

// With type safety
const db = context.require<DatabaseService>(DatabaseService);
```

**Important:** This respects singleton/transient settings:
- Singleton: Returns the shared instance
- Transient: Creates a new instance each call

### tagged(...tags)

Get assemblages that have any of the specified tags.

```typescript
tagged(...tags: string[]): any[]
```

**Example:**

```typescript
// Get all plugins
const plugins = context.tagged('plugin');

// Get assemblages with ANY of these tags
const services = context.tagged('service', 'api', 'database');
```

See [Tags](../features/tags.md) for details.

### global(identifier)

Get or set global values.

```typescript
// Get a global value
global<T = any>(identifier: string): T

// Set a global value
global<T = any>(identifier: string, value: T): void
```

**Example:**

```typescript
// Get
const apiKey = context.global<string>('apiKey');

// Set
context.global('apiKey', 'secret-key-123');
```

Global values are shared across all assemblages.

## Event Methods

The context inherits event methods from `EventManager`:

### on(channel, callback)

Register an event listener.

```typescript
on(channel: string, callback: Listener): AssemblerContext
```

**Example:**

```typescript
context.on('user:created', (user) => {
  console.log('User created:', user);
});

// Listen to all events
context.on('*', (data) => {
  console.log('Event:', data);
});
```

### once(channel, callback)

Register a one-time event listener.

```typescript
once(channel: string, callback: Listener): AssemblerContext
```

**Example:**

```typescript
context.once('app:ready', () => {
  console.log('App is ready');
});
```

### off(channel, callback?)

Remove event listener(s).

```typescript
off(channel: string, callback?: Listener): AssemblerContext
```

**Example:**

```typescript
// Remove specific listener
const handler = (data) => console.log(data);
context.on('event', handler);
context.off('event', handler);

// Remove all listeners for a channel
context.off('event');
```

See [Events](../features/events.md) for details.

## Properties

### identifiers

Get all registered identifiers.

```typescript
identifiers: Identifier[]
```

**Example:**

```typescript
console.log('Registered:', context.identifiers);
```

### entryAssemblage

Get the entry assemblage instance.

```typescript
entryAssemblage: any
```

**Example:**

```typescript
const entry = context.entryAssemblage;
console.log('Entry:', entry.constructor.name);
```

## Complete Example

```typescript
@Assemblage({ tags: ['plugin'] })
class AuthPlugin implements AbstractAssemblage {
  name = 'auth';
}

@Assemblage({ tags: ['plugin'] })
class StoragePlugin implements AbstractAssemblage {
  name = 'storage';
}

@Assemblage({
  inject: [[AuthPlugin], [StoragePlugin]],
  global: { version: '1.0.0' },
})
class PluginManager implements AbstractAssemblage {
  constructor(@Context() private context: AssemblerContext) {}
  
  onInit() {
    // Check registration
    if (this.context.has(AuthPlugin)) {
      console.log('Auth plugin registered');
    }
    
    // Require dependency
    const auth = this.context.require(AuthPlugin);
    console.log('Auth plugin:', auth.name);
    
    // Get by tags
    const plugins = this.context.tagged('plugin');
    console.log(`Found ${plugins.length} plugins`);
    
    // Global values
    const version = this.context.global<string>('version');
    console.log('Version:', version);
    
    // Set global
    this.context.global('initialized', true);
    
    // Events
    this.context.on('plugin:loaded', (name) => {
      console.log(`Plugin loaded: ${name}`);
    });
    
    // All identifiers
    console.log('Identifiers:', this.context.identifiers);
  }
}
```

## Dynamic Dependency Resolution

Use `require()` to resolve dependencies dynamically:

```typescript
@Assemblage()
class DynamicService implements AbstractAssemblage {
  constructor(@Context() private context: AssemblerContext) {}
  
  getService(serviceName: string) {
    // Dynamically resolve based on condition
    switch (serviceName) {
      case 'logger':
        return this.context.require(LoggerService);
      case 'database':
        return this.context.require(DatabaseService);
      default:
        throw new Error(`Unknown service: ${serviceName}`);
    }
  }
}
```

## Factory Pattern

Create a factory using `require()` with transient services:

```typescript
@Assemblage({ singleton: false })
class Task implements AbstractAssemblage {
  execute(data: any) {
    console.log('Processing:', data);
  }
}

@Assemblage({ inject: [[Task]] })
class TaskFactory implements AbstractAssemblage {
  constructor(@Context() private context: AssemblerContext) {}
  
  createTask(): Task {
    // Returns a new Task instance each call
    return this.context.require(Task);
  }
}
```

See [Singleton vs Transient](../features/singleton-transient.md) for details.

## Type Definitions

```typescript
// Identifier type
type Identifier<T = any> = Function | string | symbol;

// Listener type
type Listener = (...args: any[]) => void | Promise<void>;

// AssemblerContext interface
interface AssemblerContext {
  has(identifier: Identifier): boolean;
  require<T>(identifier: Identifier<T>): T;
  tagged(...tags: string[]): any[];
  global<T = any>(identifier: string): T;
  global<T = any>(identifier: string, value: T): void;
  on(channel: string, callback: Listener): AssemblerContext;
  once(channel: string, callback: Listener): AssemblerContext;
  off(channel: string, callback?: Listener): AssemblerContext;
  identifiers: Identifier[];
  entryAssemblage: any;
}
```

## Next Steps

- [Assembler API](./assembler.md) - Container bootstrap
- [Parameter Decorators](../decorators/parameter-decorators.md) - Inject context with `@Context()`
- [Events](../features/events.md) - Event system
- [Tags](../features/tags.md) - Retrieve by tags
- [Advanced Examples](../guides/advanced-examples.md) - Real-world patterns
