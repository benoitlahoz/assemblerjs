# Transversals (Aspect-Oriented Programming)

## Overview

Transversals provide Aspect-Oriented Programming (AOP) capabilities in assembler.js, allowing you to implement **cross-cutting concerns** in a modular and reusable way. Cross-cutting concerns are functionalities that affect multiple parts of an application, such as logging, security, caching, performance monitoring, and validation.

## What is a Transversal?

A **Transversal** is a specialized type of `Assemblage` that:
- Intercepts method calls on other assemblages
- Executes additional logic before, after, or around the target method
- Is automatically injected and managed by the DI container
- Is singleton by default (shared across all contexts)
- Cannot have `inject` or `use` properties (dependencies are resolved from parent context)

## Key Concepts

### Advices

An **advice** is a piece of code that runs at a specific point during method execution. assembler.js supports three types of advices:

1. **@Before** - Executes before the target method
2. **@After** - Executes after the target method completes (receives result)
3. **@Around** - Wraps the target method (can control execution)

### Pointcuts

A **pointcut** is an expression that determines which methods should be intercepted by an advice. The syntax is:

```typescript
execution(ClassName.methodName)
```

Wildcards are supported:
- `execution(UserService.*)` - All methods in UserService
- `execution(*.create)` - All create methods in any class
- `execution(*.*)` - All methods in all classes

### Join Points

A **join point** represents a specific point in your program execution where an advice can be applied - typically a method call.

### AdviceContext

The `AdviceContext` provides information about the intercepted method:
- `target` - The instance being called
- `methodName` - Name of the method
- `args` - Array of arguments passed to the method
- `result` - Return value (for @After advice)
- `proceed()` - Function to continue execution (for @Around advice)
- `config` - Optional configuration from @Affect decorator

## Creating a Transversal

### Basic Example

```typescript
import { Transversal, Before, After, Around, AbstractTransversal, type AdviceContext } from 'assemblerjs';

@Transversal()
class LoggingTransversal implements AbstractTransversal {
  onInit() {
    console.log('LoggingTransversal initialized');
  }

  @Before('execution(*.*)')
  logBefore(context: AdviceContext) {
    console.log(`[BEFORE] ${context.methodName}`, context.args);
  }

  @After('execution(*.*)')
  logAfter(context: AdviceContext) {
    console.log(`[AFTER] ${context.methodName} =>`, context.result);
  }

  @Around('execution(*.create)')
  async measurePerformance(context: AdviceContext) {
    const start = Date.now();
    const result = await context.proceed!();
    const duration = Date.now() - start;
    console.log(`[PERF] ${context.methodName} took ${duration}ms`);
    return result;
  }
}
```

### With Dependencies

Transversals can receive dependencies through constructor parameters:

```typescript
@Transversal()
class ValidationTransversal implements AbstractTransversal {
  constructor(
    private logger: Logger,
    @Configuration('validation') private config: any
  ) {}

  @Before('execution(*.save)')
  validate(context: AdviceContext) {
    const [data] = context.args;
    if (!data) {
      throw new Error('Data is required');
    }
    this.logger.log('Validation passed');
  }
}
```

## Registering Transversals

Transversals are registered using the `engage` property in an assemblage definition:

```typescript
@Assemblage({
  inject: [[UserService]],
  engage: [[LoggingTransversal], [ValidationTransversal]]
})
class App implements AbstractAssemblage {
  constructor(private userService: UserService) {}
}
```

The transversals will automatically intercept methods on `UserService` and all its dependencies based on their pointcut expressions.

## Explicit Application with @Affect

You can explicitly apply a transversal to specific methods using the `@Affect` decorator, regardless of pointcut matching:

```typescript
@Assemblage()
class UserService {
  // Only this method will be affected by LoggingTransversal
  @Affect(LoggingTransversal)
  create(name: string) {
    return { id: '1', name };
  }

  // This method won't be logged (no pointcut match, no @Affect)
  findAll() {
    return [];
  }
}
```

### Multiple Transversals on Same Method

You can apply multiple transversals to a single method:

```typescript
@Assemblage()
class ProductService {
  @Affect(LoggingTransversal)
  @Affect(ValidationTransversal)
  @Affect(PerformanceTransversal, { threshold: 100 })
  async create(data: any) {
    // Implementation
  }
}
```

### Combining Pointcuts and @Affect

You can use both automatic pointcut matching and explicit @Affect:

```typescript
@Transversal()
class MixedTransversal {
  // Automatically applied to all 'create' methods
  @Before('execution(*.create)')
  autoApplied(context: AdviceContext) {
    console.log('[AUTO]', context.methodName);
  }

  // Only applied where explicitly marked with @Affect
  @Before('execution(NothingMatches.*)')
  manualApplied(context: AdviceContext) {
    console.log('[MANUAL]', context.methodName);
  }
}

@Assemblage()
class OrderService {
  // Triggers autoApplied via pointcut
  create(data: any) { }

  // Triggers manualApplied via @Affect
  @Affect(MixedTransversal)
  update(id: string, data: any) { }
}
```

## Advice Priorities

When multiple advices match the same method, they execute in priority order (higher values first):

```typescript
@Transversal()
class SecurityTransversal {
  @Before('execution(*.*)', 100)  // Executes first
  checkAuth(context: AdviceContext) {
    // Security check
  }
}

@Transversal()
class ValidationTransversal {
  @Before('execution(*.*)', 50)  // Executes second
  validate(context: AdviceContext) {
    // Validation
  }
}
```

Default priority is `0`. Same-priority advices execute in registration order.

## Around Advice Details

`@Around` advice has full control over method execution:

```typescript
@Around('execution(*.save)')
async interceptSave(context: AdviceContext) {
  // Pre-processing
  console.log('Before save');
  
  try {
    // Call the next advice or original method
    const result = await context.proceed!();
    
    // Post-processing
    console.log('After save, result:', result);
    
    // Can modify result
    return { ...result, timestamp: Date.now() };
  } catch (error) {
    // Error handling
    console.error('Save failed:', error);
    throw error;
  }
}
```

**Important:** Always call `context.proceed()` to continue the chain, unless you intentionally want to block execution.

## Use Cases

### 1. Logging

```typescript
@Transversal()
class LoggingTransversal implements AbstractTransversal {
  @Before('execution(*.*)')
  logMethodCall(context: AdviceContext) {
    console.log(`Calling ${context.methodName}`, context.args);
  }
}
```

### 2. Performance Monitoring

```typescript
@Transversal()
class PerformanceTransversal implements AbstractTransversal {
  @Around('execution(*.*)')
  async measureTime(context: AdviceContext) {
    const start = performance.now();
    const result = await context.proceed!();
    const duration = performance.now() - start;
    
    if (duration > 100) {
      console.warn(`Slow method: ${context.methodName} (${duration}ms)`);
    }
    
    return result;
  }
}
```

### 3. Caching

```typescript
@Transversal()
class CachingTransversal implements AbstractTransversal {
  private cache = new Map<string, any>();

  @Around('execution(*.find*)')
  async cacheRead(context: AdviceContext) {
    const key = `${context.methodName}:${JSON.stringify(context.args)}`;
    
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    const result = await context.proceed!();
    this.cache.set(key, result);
    return result;
  }
}
```

### 4. Security/Authorization

```typescript
@Transversal()
class SecurityTransversal implements AbstractTransversal {
  constructor(private authService: AuthService) {}

  @Before('execution(*.delete*)', 100)
  checkPermission(context: AdviceContext) {
    if (!this.authService.hasPermission('delete')) {
      throw new Error('Access denied');
    }
  }
}
```

### 5. Validation

```typescript
@Transversal()
class ValidationTransversal implements AbstractTransversal {
  @Before('execution(*.save)')
  validateData(context: AdviceContext) {
    const [data] = context.args;
    
    if (!data || !data.name) {
      throw new Error('Invalid data: name is required');
    }
  }
}
```

## Best Practices

1. **Keep Transversals Focused** - Each transversal should handle one concern (logging, security, etc.)

2. **Use Specific Pointcuts** - Avoid `execution(*.*)` when possible; target specific methods or classes

3. **Respect Priorities** - Use priorities to ensure proper execution order (security before validation, etc.)

4. **Handle Errors in @Around** - Always wrap `context.proceed()` in try-catch when using @Around

5. **Avoid Side Effects in @Before** - @Before advices should not modify arguments (use @Around for that)

6. **Use @Affect for Fine-Grained Control** - When pointcuts are too broad or complex, use explicit @Affect

7. **Implement AbstractTransversal** - Implement the interface for type safety and lifecycle hooks

8. **Test Transversals Independently** - Write unit tests for transversal logic separately from integration tests

## Lifecycle

Transversals follow the standard assemblage lifecycle:

1. **Class Registration** - `static onRegister()` called when class is registered
2. **Instantiation** - Constructor called with resolved dependencies
3. **Initialization** - `onInit()` called after all dependencies are resolved
4. **Active** - Advices intercept method calls
5. **Disposal** - `onDispose()` called on cleanup

```typescript
@Transversal()
class LifecycleTransversal implements AbstractTransversal {
  static onRegister(context: AssemblerContext) {
    console.log('Transversal registered');
  }

  onInit() {
    console.log('Transversal initialized');
  }

  onDispose() {
    console.log('Transversal disposed');
  }
}
```

## Performance Considerations

- Transversals add overhead to method calls
- Use specific pointcuts to minimize unnecessary interceptions
- @Around advice is slightly more expensive than @Before/@After
- Transversals are singleton by default (minimal instantiation overhead)
- Consider using @Affect for performance-critical paths that need selective interception

## Limitations

1. **Cannot intercept constructors** - Only methods can be intercepted
2. **Cannot have inject/use** - Transversals receive dependencies via constructor parameters only
3. **Singleton only** - Transversals cannot be transient (by design)
4. **Pointcut syntax** - AssemblerJS focuses on method execution join points. It does not intercept calls, property access, or assignments.
5. **No private methods** - Can only intercept public methods

## Next Steps

- Learn about [AOP Decorators](../decorators/aop-decorators.md)
- See [Advanced Examples](../guides/advanced-examples.md) for real-world usage
- Check [API Types](../api/types.md) for AdviceContext and related types
