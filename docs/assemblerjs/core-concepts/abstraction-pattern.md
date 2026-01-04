# Abstraction Pattern

`assembler.js` follows a powerful abstraction pattern for dependency injection that promotes loose coupling and flexibility.

## The Pattern

1. **Define an abstraction** that implements `AbstractAssemblage` with your contract (methods/properties)
2. **Create concrete implementations** that implement your abstraction (NOT `AbstractAssemblage` directly)
3. **Inject using the abstraction** as the type, allowing easy implementation swapping

## Why This Pattern?

- ✅ **Decoupling** - Your code depends on abstractions, not concrete implementations
- ✅ **Testability** - Easy to mock abstract classes in tests
- ✅ **Flexibility** - Change implementations without modifying dependent code
- ✅ **Type Safety** - TypeScript ensures implementations match the contract
- ✅ **Contract Enforcement** - Abstractions define the interface, implementations must comply

## Complete Example

```typescript
// 1. Define the abstraction - implements AbstractAssemblage + your contract
abstract class AbstractLogger implements AbstractAssemblage {
  abstract log(message: string): void;
  abstract error(message: string): void;
  abstract warn(message: string): void;  // Your custom methods
}

// 2. Create concrete implementations - implement the abstraction
@Assemblage()
class ConsoleLogger implements AbstractLogger {
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }
  
  error(message: string) {
    console.error(`[ERROR] ${message}`);
  }
  
  warn(message: string) {
    console.warn(`[WARN] ${message}`);
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
  
  warn(message: string) {
    // Write warning to file
  }
}

// 3. Use the abstraction - bind to concrete implementation
@Assemblage({
  inject: [
    [AbstractLogger, ConsoleLogger], // Bind abstraction to implementation
  ],
})
class Application implements AbstractAssemblage {
  constructor(private logger: AbstractLogger) {  // Type is abstract
    // You can now easily swap ConsoleLogger with FileLogger
    // without changing Application code
  }
  
  start() {
    this.logger.log('Application started');
    this.logger.warn('This is a warning');
  }
}
```

## Multiple Implementations

You can have multiple implementations of the same abstraction:

```typescript
abstract class AbstractCache implements AbstractAssemblage {
  abstract get(key: string): any;
  abstract set(key: string, value: any): void;
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

@Assemblage()
class RedisCache implements AbstractCache {
  get(key: string) {
    // Get from Redis
  }
  
  set(key: string, value: any) {
    // Set in Redis
  }
}

// Development - use MemoryCache
@Assemblage({
  inject: [[AbstractCache, MemoryCache]],
})
class DevelopmentApp implements AbstractAssemblage {
  constructor(private cache: AbstractCache) {}
}

// Production - use RedisCache
@Assemblage({
  inject: [[AbstractCache, RedisCache]],
})
class ProductionApp implements AbstractAssemblage {
  constructor(private cache: AbstractCache) {}
}
```

## Advanced: Data Store Pattern

```typescript
// Define abstractions
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
```

## Testing with Abstractions

Abstractions make testing easy:

```typescript
// Mock implementation for testing
class MockLogger implements AbstractLogger {
  logs: string[] = [];
  
  log(message: string) {
    this.logs.push(message);
  }
  
  error(message: string) {
    this.logs.push(`ERROR: ${message}`);
  }
  
  warn(message: string) {
    this.logs.push(`WARN: ${message}`);
  }
}

// Test
@Assemblage({
  inject: [[AbstractLogger, MockLogger]],
})
class TestApp implements AbstractAssemblage {
  constructor(private logger: AbstractLogger) {}
}

const app = Assembler.build(TestApp);
// logger is now MockLogger, easy to inspect logs
```

## Important Notes

- The abstraction (`AbstractLogger`) is what implements `AbstractAssemblage`
- Concrete implementations (`ConsoleLogger`, `FileLogger`) only implement the abstraction
- Always use the abstraction as the type in constructors
- This pattern is optional - you can inject concrete classes directly if you don't need abstraction

## Next Steps

- [Dependency Injection](./dependency-injection.md) - Learn injection syntax
- [Lifecycle Hooks](./lifecycle-hooks.md) - Control initialization
- [Advanced Examples](../guides/advanced-examples.md) - See real-world patterns
