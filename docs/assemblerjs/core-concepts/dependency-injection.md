# Dependency Injection

Dependencies are declared in the `inject` property of the `@Assemblage` decorator and injected via the constructor.

## Basic Injection

The simplest form injects a concrete class:

```typescript
@Assemblage({
  inject: [[ConcreteClass]],
})
class MyApp implements AbstractAssemblage {
  constructor(private service: ConcreteClass) {
    // service is ready to use
  }
}
```

## Interface Binding (Abstraction)

Bind an abstraction to a concrete implementation:

```typescript
@Assemblage({
  inject: [
    [AbstractClass, ConcreteClass], // AbstractClass must implement AbstractAssemblage
  ],
})
class MyApp implements AbstractAssemblage {
  constructor(
    private abstraction: AbstractClass  // Type is the abstraction
  ) {
    // Use the abstraction, not the concrete type
  }
}
```

**Key point:** When using interface binding `[AbstractClass, ConcreteClass]`:
- The **first** parameter is your abstraction (which implements `AbstractAssemblage`)
- The **second** parameter is the concrete implementation (which implements the abstraction)
- The injected type is always the abstraction, allowing easy implementation swapping

See [Abstraction Pattern](./abstraction-pattern.md) for complete examples.

## Injection with Configuration

Pass configuration to dependencies:

```typescript
@Assemblage({
  inject: [
    [DatabaseService, { host: 'localhost', port: 5432 }],
  ],
})
class MyApp implements AbstractAssemblage {
  constructor(private db: DatabaseService) {
    // db receives the configuration in its onInit hook
  }
}
```

The configuration object is passed to:
- The `onInit` hook of the dependency
- The `onDispose` hook of the dependency
- Accessible via `@Configuration()` decorator

## Multiple Dependencies

Inject multiple dependencies:

```typescript
@Assemblage({
  inject: [
    [Logger],
    [DatabaseService],
    [CacheService],
  ],
})
class MyApp implements AbstractAssemblage {
  constructor(
    private logger: Logger,
    private db: DatabaseService,
    private cache: CacheService
  ) {
    // All dependencies are injected
  }
}
```

**Note:** Dependencies are resolved by type using TypeScript's reflection system. The order of constructor parameters doesn't need to match the `inject` array order.

## Dependency Resolution

The DI container resolves dependencies recursively:

1. **Entry Point** - Start from the entry assemblage (passed to `Assembler.build()`)
2. **Register** - Call `onRegister()` static method for each assemblage
3. **Resolve** - Recursively resolve all dependencies
4. **Build** - Construct instances (respecting singleton/transient)
5. **Initialize** - Call `onInit()` bottom-up (dependencies first)

### Resolution Example

```typescript
@Assemblage()
class ChildService implements AbstractAssemblage {}

@Assemblage({ inject: [[ChildService]] })
class ParentService implements AbstractAssemblage {
  constructor(private child: ChildService) {}
}

@Assemblage({ inject: [[ParentService]] })
class App implements AbstractAssemblage {
  constructor(private parent: ParentService) {}
}

const app = Assembler.build(App);
// Resolution order:
// 1. Register: App → ParentService → ChildService
// 2. Construct: ChildService → ParentService → App
// 3. Initialize: ChildService.onInit() → ParentService.onInit() → App.onInit()
```

## Optional Dependencies

Mark dependencies as optional with `@Optional(defaultValue?)`:

```typescript
@Assemblage()
class MyService implements AbstractAssemblage {
  constructor(
    @Optional() private logger?: LoggerService,              // undefined if not available
    @Optional(new ConsoleLogger()) private fallback: Logger  // uses default if not available
  ) {
    // logger will be undefined if LoggerService is not registered
    this.logger?.log('Service created');
  }
}
```

See [Parameter Decorators](../decorators/parameter-decorators.md) for more injection options.

## Next Steps

- [Abstraction Pattern](./abstraction-pattern.md) - Interface-based dependency injection
- [Lifecycle Hooks](./lifecycle-hooks.md) - Control initialization with dependencies
- [Parameter Decorators](../decorators/parameter-decorators.md) - Advanced injection patterns
- [Singleton vs Transient](../features/singleton-transient.md) - Control instance lifecycle
