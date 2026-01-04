# Lifecycle Hooks

Dependencies are registered and built recursively from the entry assemblage. The lifecycle follows a specific order.

## Lifecycle Overview

1. **`onRegister` (Static)** - Called when assemblage is registered
2. **`constructor`** - Instance is built with dependencies injected
3. **`onInit`** - Called when dependency tree is ready (bottom-up)
4. **`onInited`** - Called after all `onInit` hooks complete (bottom-up, then entry point)
5. **`onDispose`** - Called during cleanup (top-down: entry point first, then dependencies)

## 1. onRegister (Static)

Called when the assemblage is registered. Other dependencies may or may not be registered yet.

**Receives:** Base configuration from `@Assemblage()` definition, **not** runtime configuration.

```typescript
@Assemblage()
class MyService implements AbstractAssemblage {
  static onRegister(context: AssemblerContext, configuration: Record<string, any>) {
    console.log('Service registered');
    // configuration = base config from @Assemblage() definition
  }
}
```

**Use cases:**
- Register global values
- Setup class-level resources
- Validate configuration

## 2. constructor

The instance is built with all dependencies injected. Each dependency is resolved according to its singleton/transient setting.

```typescript
@Assemblage({ inject: [[LoggerService]] })
class MyApp implements AbstractAssemblage {
  constructor(private logger: LoggerService) {
    // Dependencies are ready to use
    this.logger.log('App constructed');
  }
}
```

**Use cases:**
- Store injected dependencies
- Initialize instance properties
- Simple synchronous setup

## 3. onInit

Called when the entire dependency tree is ready. Executed **bottom-up** (dependencies first, entry point last).

```typescript
@Assemblage()
class MyService implements AbstractAssemblage {
  async onInit(context: AssemblerContext, configuration: Record<string, any>) {
    console.log('Service initialized');
    // Perform async initialization here
  }
}
```

**Configuration parameter contains:**
- For the **entry point**: Configuration passed to `Assembler.build(EntryPoint, config)`
- For **dependencies**: Their base configuration from `@Assemblage({ inject: [..., config] })`

**Use cases:**
- Async initialization (database connections, API calls)
- Setup that requires other dependencies to be ready
- Event listener registration

## 4. onInited

Called **after all `onInit` hooks have completed** across the entire dependency tree. Executed in **reverse order for dependencies** (B → A), then the **entry point last**.

This hook is useful when you need to perform actions that depend on the complete initialization of all services.

```typescript
@Assemblage()
class MyService implements AbstractAssemblage {
  async onInited(context: AssemblerContext, configuration: Record<string, any>) {
    console.log('All services are now initialized');
    // Perform post-initialization tasks here
  }
}
```

**Execution order:**
- Dependencies' `onInit`: A → B → (entry point C)
- Dependencies' `onInited`: B → A → (entry point C)

**Configuration parameter contains:**
- For the **entry point**: Configuration passed to `Assembler.build(EntryPoint, config)`
- For **dependencies**: Their base configuration from `@Assemblage({ inject: [..., config] })`

**Use cases:**
- Final setup that requires all services to be fully initialized
- Cross-service validation or health checks
- Triggering initial events after complete system startup
- Starting background tasks that depend on the full system

## 5. onDispose

Called when disposing the assembler. Use for cleanup (closing connections, releasing resources).

**Disposal happens in reverse dependency order** - dependencies are disposed **before** their dependents.

```typescript
@Assemblage()
class DatabaseService implements AbstractAssemblage {
  async onDispose(context: AssemblerContext, configuration: Record<string, any>) {
    await this.connection.close();
    console.log('Database connection closed');
  }
}
```

**Configuration parameter contains:**
- For the **entry point**: Configuration passed to `Assembler.build(EntryPoint, config)`
- For **dependencies**: Their base configuration from `@Assemblage({ inject: [..., config] })`

**Use cases:**
- Close database connections
- Release file handles
- Cleanup timers/intervals
- Unregister event listeners

⚠️ **Important:** You must inject the dispose function with `@Dispose()` to call it:

```typescript
@Assemblage()
class App implements AbstractAssemblage {
  constructor(@Dispose() public dispose: () => void) {}
}

const app = Assembler.build(App);
await app.dispose(); // Calls onDispose on all assemblages
```

See the [warning about @Dispose()](../decorators/parameter-decorators.md#dispose) - it disposes the **entire container**.

## Execution Order Example

```typescript
@Assemblage()
class ChildService implements AbstractAssemblage {
  static onRegister() { console.log('1. Child registered'); }
  constructor() { console.log('3. Child constructed'); }
  onInit() { console.log('5. Child initialized'); }
  onInited() { console.log('7. Child inited'); }
  onDispose() { console.log('10. Child disposed'); }
}

@Assemblage({ inject: [[ChildService]] })
class ParentService implements AbstractAssemblage {
  static onRegister() { console.log('2. Parent registered'); }
  
  constructor(
    child: ChildService,
    @Dispose() public dispose: () => void
  ) { 
    console.log('4. Parent constructed'); 
  }
  
  onInit() { console.log('6. Parent initialized'); }
  onInited() { console.log('8. Parent inited'); }
  onDispose() { console.log('9. Parent disposed'); }
}

const app = Assembler.build(ParentService);
// Output: 1-8 (registration, construction, initialization, post-initialization)

await app.dispose();
// Output: 10, 9 (disposal: child first, then parent)
```

### Complex Dependency Example

With multiple dependencies (A, B) and an entry point (C):

```typescript
@Assemblage()
class ServiceA { 
  onInit() { console.log('A initialized'); }
  onInited() { console.log('A inited'); }
}

@Assemblage()
class ServiceB { 
  onInit() { console.log('B initialized'); }
  onInited() { console.log('B inited'); }
}

@Assemblage({ inject: [[ServiceA], [ServiceB]] })
class ServiceC {
  onInit() { console.log('C initialized'); }
  onInited() { console.log('C inited'); }
}

// Execution order:
// A initialized → B initialized → C initialized
// B inited → A inited → C inited
```

## Key Points

- **Registration & Construction:** Top-down order (entry point registers dependencies first)
- **Initialization (`onInit`):** Bottom-up order (dependencies A → B → entry point C)
- **Post-initialization (`onInited`):** Reverse order for dependencies (B → A), then entry point (C)
- **Disposal (`onDispose`):** Top-down order (entry point first, then dependencies)
- **Using `dispose()`:** Must be injected via `@Dispose()` decorator in the entry point constructor

## Async Hooks

Both `onInit`, `onInited`, and `onDispose` can be async:

```typescript
@Assemblage()
class DatabaseService implements AbstractAssemblage {
  async onInit() {
    await this.connect();
  }
  
  async onInited() {
    await this.runHealthCheck();
  }
  
  async onDispose() {
    await this.disconnect();
  }
}
```

The DI container will `await` these hooks before continuing.

## Error Handling

If a lifecycle hook throws an error, the build/disposal process stops:

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

## Next Steps

- [Dependency Injection](./dependency-injection.md) - Understand dependency resolution
- [Parameter Decorators](../decorators/parameter-decorators.md) - Inject context and configuration
- [Events](../features/events.md) - Setup event listeners in `onInit`
- [Advanced Examples](../guides/advanced-examples.md) - See lifecycle hooks in action
