# Parameter Decorators

`assembler.js` provides several built-in parameter decorators for dependency injection. These decorators are used in constructor parameters to inject various values.

## Built-in Decorators

### @Context()

Injects the `AssemblerContext` instance, providing access to a subset of the container's methods.

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

**Available methods:**
- `require<T>(identifier)` - Resolve a dependency
- `has(identifier)` - Check if dependency is registered
- `tagged(...tags)` - Get assemblages by tags
- `global(key)` - Get/set global values
- `on/off/once` - Event methods

See [AssemblerContext API](../api/context.md) for full details.

### @Configuration()

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

**Configuration sources:**
- For **entry point**: Configuration passed to `Assembler.build(EntryPoint, config)`
- For **dependencies**: Base configuration from `@Assemblage({ inject: [..., config] })`

### @Definition()

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

**Available properties:**
- `tags` - Array of tags
- `metadata` - Custom metadata object
- `singleton` - Boolean indicating singleton/transient
- `inject` - Dependency definitions
- `events` - Registered event channels

### @Dispose()

Injects the dispose function to clean up resources programmatically. **Required for the entry point** to access the `dispose()` method.

⚠️ **Important:** This injects the dispose function for the **entire container** (all assemblages), not just the current assemblage. Calling `dispose()` will trigger cleanup for all registered assemblages. Use with caution.

```typescript
@Assemblage()
class MyService implements AbstractAssemblage {
  constructor(@Dispose() private dispose: () => void) {}

  cleanup() {
    // ⚠️ This disposes the ENTIRE container, not just MyService
    this.dispose();
  }
}

// Usage
const app = Assembler.build(MyService);
await app.dispose(); // Calls onDispose on all assemblages
```

See [Lifecycle Hooks](../core-concepts/lifecycle-hooks.md#4-ondispose) for disposal order.

### @Use(identifier)

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

**Use cases:**
- Inject pre-existing instances
- Inject configuration objects
- Inject third-party libraries

### @Global(identifier)

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

**Use cases:**
- Share values across assemblages
- Inject environment variables
- Inject API keys or secrets

### @Optional(defaultValue?)

Marks a dependency as optional. Returns the provided default value (or `undefined`) if the dependency is not registered.

```typescript
// Without default value - returns undefined if not available
@Assemblage()
class ServiceWithOptional implements AbstractAssemblage {
  constructor(@Optional() private logger?: LoggerService) {
    // logger will be undefined if LoggerService is not registered
    this.logger?.log('Service created');
  }
}

// With default value - returns the provided value if not available
@Assemblage()
class ServiceWithDefault implements AbstractAssemblage {
  constructor(
    @Optional(new ConsoleLogger()) private logger: LoggerService,
    @Optional('default-config') private config: string,
    @Optional(null) private cache: CacheService | null
  ) {
    this.logger.log('Using logger');
  }
}
```

**Use cases:**
- Feature flags (optional features)
- Development-only dependencies  
- Graceful degradation with fallback values
- Default implementations

## Combining Decorators

You can combine multiple decorators in a single constructor:

```typescript
@Assemblage({
  inject: [[DatabaseService]],
  use: [['config', { host: 'localhost' }]],
  global: { apiKey: 'secret' },
})
class Application implements AbstractAssemblage {
  constructor(
    private db: DatabaseService,           // Regular injection
    @Use('config') private config: any,    // Use decorator
    @Global() private globals: any, // Global decorator
    @Context() private context: AssemblerContext, // Context
    @Definition() private def: AssemblageDefinition, // Definition
    @Optional() private logger?: Logger    // Optional dependency
  ) {}
}
```

**Important:** Constructor parameter order must match the `inject` array order for regular dependencies.

## Type Safety

All decorators preserve TypeScript type information:

```typescript
interface Config {
  host: string;
  port: number;
}

@Assemblage()
class MyService implements AbstractAssemblage {
  constructor(@Configuration() private config: Config) {
    // config is typed as Config
    const host: string = config.host; // ✓ Type-safe
    const port: number = config.port; // ✓ Type-safe
  }
}
```

## Next Steps

- [Custom Parameter Decorators](./custom-parameter.md) - Create your own decorators
- [Custom Class Decorators](./custom-class.md) - Type-safe class decorators
- [Lifecycle Hooks](../core-concepts/lifecycle-hooks.md) - Use decorators with lifecycle
- [AssemblerContext API](../api/context.md) - Full context documentation
