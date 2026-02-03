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

## Caller Tracking

Transversals support caller tracking, allowing you to identify which assemblage or external component initiated a method call. This is useful for audit logging, permission checking, and request tracing.

### Using Caller Information in Advices

The `AdviceContext` provides caller information:

- `caller` - The class name of the caller
- `callerIdentifier` - Optional unique identifier (string or symbol) for the caller

```typescript
@Transversal()
class AuditTransversal implements AbstractTransversal {
  @Before('execution(*.*)')
  auditCall(context: AdviceContext) {
    console.log(
      `[AUDIT] ${context.caller || 'Unknown'} called ${context.target.constructor.name}.${context.methodName}`
    );
  }

  @Before('execution(*.delete)')
  checkDeletePermission(context: AdviceContext) {
    // Only allow deletions from specific callers
    if (context.caller !== 'AdminService') {
      throw new Error(`Access denied: ${context.caller} cannot delete`);
    }
  }
}
```

### Tracking External Callers

For callers outside the DI container (e.g., Vue components, external scripts), use `TransversalWeaver.withCaller()` or `TransversalWeaver.wrapCaller()`:

#### One-time execution with withCaller

```typescript
import { TransversalWeaver } from 'assemblerjs';

// In a Vue component
export default {
  methods: {
    async saveUser() {
      await TransversalWeaver.withCaller('UserEditComponent', async () => {
        await this.userService.save(userData);
        // Advices will see caller = 'UserEditComponent'
      });
    }
  }
};
```

#### Reusable wrapped functions with wrapCaller

For functions you'll call multiple times, use `wrapCaller` to create a wrapped function:

```typescript
import { TransversalWeaver } from 'assemblerjs';

// In a Vue component
export default {
  setup() {
    // Create wrapped function once
    const mergeClasses = TransversalWeaver.wrapCaller(
      'LeafletMap',
      'LeafletMap.vue',
      (...args) => tailwind.mergeClasses(...args)
    );

    return {
      // Can be called multiple times, always maintains caller context
      mergeClasses
    };
  }
};
```

### Setting Caller with Identifier

For more detailed tracking, provide an identifier alongside the caller:

```typescript
@Transversal()
class RequestTracingTransversal implements AbstractTransversal {
  @Before('execution(*.*)')
  traceRequest(context: AdviceContext) {
    const callerId = context.callerIdentifier 
      ? ` (ID: ${String(context.callerIdentifier)})`
      : '';
    console.log(`Request from: ${context.caller}${callerId}`);
  }
}

// Usage
const requestId = Symbol('request-123');
await TransversalWeaver.withCaller('APIController', requestId, async () => {
  await service.processRequest();
});
```

### Getting Current Caller Context

Access the current caller outside of advices using `TransversalWeaver.getCurrentCaller()`:

```typescript
class ServiceA {
  someMethod() {
    const caller = TransversalWeaver.getCurrentCaller();
    if (caller) {
      console.log(`Called by: ${caller.className} (ID: ${caller.identifier})`);
    }
  }
}
```

### Working Without Transversals

Caller tracking works even when no transversals are engaged:

```typescript
// No transversals needed for caller context to work
@Assemblage()
class App {
  constructor(private service: ServiceA) {}

  async run() {
    await TransversalWeaver.withCaller('App', async () => {
      const result = await this.service.someMethod();
      // Even without advices, getCurrentCaller() will return 'App'
    });
  }
}
```

### Use Cases

1. **Audit Logging** - Track who accessed sensitive data
   ```typescript
   @Before('execution(*.findSensitiveData)')
   auditAccess(context: AdviceContext) {
     this.logger.info(`${context.caller} accessed sensitive data`);
   }
   ```

2. **Permission Checking** - Restrict operations by caller
   ```typescript
   @Before('execution(*.delete)', 100)
   checkAuthorization(context: AdviceContext) {
     if (!this.canDelete(context.caller)) {
       throw new Error(`${context.caller} not authorized to delete`);
     }
   }
   ```

3. **Request Tracing** - Track request flow across services
   ```typescript
   @Before('execution(*.*)')
   traceFlow(context: AdviceContext) {
     if (context.callerIdentifier) {
       console.log(`[Trace ${context.callerIdentifier}] ${context.caller} → ${context.methodName}`);
     }
   }
   ```

4. **Conditional Behavior** - Different behavior based on caller
   ```typescript
   @Around('execution(*.getData)')
   async getData(context: AdviceContext) {
     if (context.caller === 'AdminService') {
       return await context.proceed!(); // Full data
     } else {
       const data = await context.proceed!();
       return this.filterSensitiveFields(data); // Filtered data
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
