# Assembler API

The `Assembler` class **is the DI container**. It provides static methods for bootstrapping and managing assemblages.

## Static Methods

### build<T>(Assemblage, configuration?)

Build and initialize an application from an entry assemblage.

```typescript
import { Assembler } from 'assemblerjs';

const app = Assembler.build<MyApp>(MyApp, configuration?);
```

**Parameters:**
- `Assemblage` - The entry point class (decorated with `@Assemblage`)
- `configuration` (optional) - Runtime configuration object

**Returns:** Instance of the entry assemblage with all dependencies injected and initialized

**Type parameter:** `<T>` - Type of the entry assemblage for type-safe return value

**Example:**

```typescript
@Assemblage()
class Application implements AbstractAssemblage {
  constructor(@Configuration() private config: any) {}
  
  start() {
    console.log('App started');
  }
}

const app = Assembler.build(Application, { 
  host: 'localhost',
  port: 3000 
});

app.start(); // ✓ Type-safe method call
```

### context

Get the `AssemblerContext` instance (provides access to container methods).

```typescript
const context = Assembler.context;
```

**Returns:** `AssemblerContext` instance

See [AssemblerContext API](./context.md) for available methods.

## Build Process

When you call `Assembler.build()`, the following happens:

1. **Registration** - Call `onRegister()` static method for the entry assemblage and all dependencies (top-down)
2. **Resolution** - Recursively resolve all dependencies
3. **Construction** - Build instances respecting singleton/transient settings
4. **Initialization** - Call `onInit()` on all assemblages (bottom-up: dependencies first, entry point last)

See [Lifecycle Hooks](../core-concepts/lifecycle-hooks.md) for details.

## Disposing the Container

To cleanup resources, call the `dispose()` method on the entry assemblage. This requires injecting the dispose function with `@Dispose()`:

```typescript
@Assemblage()
class Application implements AbstractAssemblage {
  constructor(@Dispose() public dispose: () => void) {}
}

const app = Assembler.build(Application);

// Cleanup
await app.dispose(); // Calls onDispose on all assemblages
```

**Important:** `dispose()` must be injected via `@Dispose()` decorator to be accessible. See the [warning about @Dispose()](../decorators/parameter-decorators.md#dispose).

## Complete Example

```typescript
import 'reflect-metadata';
import { Assemblage, Assembler, AbstractAssemblage } from 'assemblerjs';

// Define services
@Assemblage()
class DatabaseService implements AbstractAssemblage {
  async onInit() {
    console.log('Database connected');
  }
  
  async onDispose() {
    console.log('Database disconnected');
  }
}

// Define application
@Assemblage({
  inject: [[DatabaseService]],
  global: { appName: 'MyApp' },
})
class Application implements AbstractAssemblage {
  constructor(
    @Global('appName') private name: string,
    @Dispose() public dispose: () => void,
    private db: DatabaseService
  ) {}
  
  start() {
    console.log(`${this.name} started`);
  }
}

// Bootstrap
const app = Assembler.build(Application);
// Output: "Database connected"

app.start();
// Output: "MyApp started"

// Cleanup
await app.dispose();
// Output: "Database disconnected"
```

## Configuration Override

The configuration passed to `Assembler.build()` overrides the entry assemblage's configuration:

```typescript
@Assemblage()
class App implements AbstractAssemblage {
  constructor(@Configuration() private config: any) {
    console.log(config.mode); // 'production'
  }
}

// Runtime configuration
const app = Assembler.build(App, { mode: 'production' });
```

For dependencies, configuration is specified in the `inject` array:

```typescript
@Assemblage({
  inject: [
    [DatabaseService, { host: 'localhost', port: 5432 }],
  ],
})
class App implements AbstractAssemblage {}
```

See [Dependency Injection](../core-concepts/dependency-injection.md) for more details.

## Error Handling

If initialization fails, `build()` throws an error:

```typescript
@Assemblage()
class FailingService implements AbstractAssemblage {
  onInit() {
    throw new Error('Initialization failed');
  }
}

try {
  const app = Assembler.build(FailingService);
} catch (error) {
  console.error('Build failed:', error);
}
```

## Type Safety

Use TypeScript generics for type-safe access to the built instance:

```typescript
@Assemblage()
class TypedApp implements AbstractAssemblage {
  myMethod() {
    return 'result';
  }
}

// ✓ Type-safe
const app = Assembler.build<TypedApp>(TypedApp);
app.myMethod(); // ✓ TypeScript knows this method exists

// Without generic
const app2 = Assembler.build(TypedApp);
app2.myMethod(); // ✓ Still works, but less explicit
```

## Next Steps

- [AssemblerContext API](./context.md) - Access container methods
- [Lifecycle Hooks](../core-concepts/lifecycle-hooks.md) - Build process lifecycle
- [Dependency Injection](../core-concepts/dependency-injection.md) - Injection patterns
- [Quick Start](../getting-started/quick-start.md) - Build your first app
