# Assemblage

The main building block of `assembler.js`. An **Assemblage** is a class decorated with `@Assemblage` that can be injected as a dependency.

## Basic Concept

An assemblage is a reusable component that:
- Can be injected into other assemblages
- Has lifecycle hooks (`onRegister`, `onInit`, `onDispose`)
- Can be singleton or transient
- Can emit and listen to events
- Can have metadata and tags

## Concrete Services

For concrete services, implement `AbstractAssemblage` directly:

```typescript
@Assemblage()
export class Logger implements AbstractAssemblage {
  log(message: string) {
    console.log(message);
  }
}
```

## Abstractions (Interfaces)

For abstractions (interfaces), create an abstract class that implements `AbstractAssemblage` and define your contract:

```typescript
// Define the abstraction
abstract class AbstractLogger implements AbstractAssemblage {
  abstract log(message: string): void;
  abstract error(message: string): void;
}

// Implementations only implement the abstraction (which already extends AbstractAssemblage)
@Assemblage()
class ConsoleLogger implements AbstractLogger {
  log(message: string) { console.log(message); }
  error(message: string) { console.error(message); }
}
```

This pattern allows you to swap implementations without changing dependent code. See [Abstraction Pattern](./abstraction-pattern.md) for more details.

## Assemblage Configuration

The `@Assemblage` decorator accepts a configuration object:

```typescript
@Assemblage({
  singleton: true, // Default: true - share instance across the application
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

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `singleton` | `boolean` | `true` | If `true`, one instance is shared. If `false`, new instance per injection. |
| `inject` | `Array` | `[]` | Dependencies to inject (see [Dependency Injection](./dependency-injection.md)) |
| `use` | `Array` | `[]` | Objects/instances to register for `@Use()` decorator |
| `tags` | `string[]` | `[]` | Tags for grouping (see [Tags](../features/tags.md)) |
| `events` | `string[]` | `[]` | Event channels to register (see [Events](../features/events.md)) |
| `metadata` | `object` | `{}` | Custom metadata accessible via `@Definition()` |
| `global` | `object` | `{}` | Global values accessible via `@Global()` |

## Why AbstractAssemblage?

The `AbstractAssemblage` interface marks classes as injectable and provides:
- Type safety at compile time
- Clear contract for assemblage classes
- Optional lifecycle hooks (`onInit`, `onDispose`)
- Integration with the DI container

## Next Steps

- [Dependency Injection](./dependency-injection.md) - Learn how to inject dependencies
- [Abstraction Pattern](./abstraction-pattern.md) - Understand interface-based design
- [Lifecycle Hooks](./lifecycle-hooks.md) - Control initialization and cleanup
- [Singleton vs Transient](../features/singleton-transient.md) - Control instance lifecycle
