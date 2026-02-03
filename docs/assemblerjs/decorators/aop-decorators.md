# AOP Decorators

assembler.js provides a complete set of decorators for implementing Aspect-Oriented Programming (AOP) patterns. These decorators enable you to define cross-cutting concerns in a declarative and type-safe manner.

## Table of Contents

- [@Transversal](#transversal)
- [@Before](#before)
- [@After](#after)
- [@Around](#around)
- [@Affect](#affect)

---

## @Transversal

Marks a class as a Transversal (aspect), which is a specialized assemblage that provides cross-cutting concerns.

### Signature

```typescript
function Transversal(definition?: Omit<AssemblageDefinition, 'inject' | 'use'>): ClassDecorator
```

### Parameters

- `definition` (optional): Assemblage configuration options, except `inject` and `use`
  - `singleton` - Default is `true` (cannot be changed)
  - `tags` - Array of tags for grouping
  - `metadata` - Custom metadata

### Characteristics

- **Singleton by default** - Transversals are shared across all contexts
- **No inject/use** - Dependencies are received through constructor parameters
- **Automatic registration** - Registered when used in `engage` array
- **Advice container** - Methods decorated with @Before, @After, @Around become advices

### Examples

#### Basic Transversal

```typescript
import { Transversal, AbstractTransversal } from 'assemblerjs';

@Transversal()
class LoggingTransversal implements AbstractTransversal {
  onInit() {
    console.log('LoggingTransversal ready');
  }
}
```

#### Transversal with Dependencies

```typescript
@Transversal()
class SecurityTransversal implements AbstractTransversal {
  constructor(
    private authService: AuthService,
    @Configuration() private config: SecurityConfig
  ) {}

  onInit() {
    console.log('SecurityTransversal initialized with config:', this.config);
  }
}
```

#### Transversal with Tags

```typescript
@Transversal({ tags: ['logging', 'audit'] })
class AuditTransversal implements AbstractTransversal {
  // Implementation
}
```

### Restrictions

- Cannot be combined with `@Assemblage` decorator
- Cannot specify `inject` or `use` in definition
- Must be used with at least one advice decorator (@Before, @After, or @Around)

---

## @Before

Defines an advice that executes **before** a target method.

### Signature

```typescript
function Before(pointcut: string, priority?: number): MethodDecorator
```

### Parameters

- `pointcut`: Pointcut expression matching target methods
- `priority` (optional): Execution priority, default is `0` (higher values execute first)

### Method Signature

The decorated method receives an `AdviceContext`:

```typescript
methodName(context: AdviceContext): void | Promise<void>
```

### AdviceContext Properties

- `target` - The target instance
- `methodName` - Name of the intercepted method
- `args` - Array of arguments passed to the method
- `config` - Optional configuration from @Affect decorator
- `caller` (optional) - Class name of the component that initiated the call
- `callerIdentifier` (optional) - Unique identifier for the caller (useful for tracing)

See [Caller Tracking](../core-concepts/transversals-aop.md#caller-tracking) for detailed information.

### Examples

#### Basic @Before Advice

```typescript
@Transversal()
class LoggingTransversal {
  @Before('execution(*.*)')
  logMethodCall(context: AdviceContext) {
    console.log(`Calling ${context.methodName}`, context.args);
  }
}
```

#### With Caller Tracking

```typescript
@Transversal()
class AuditTransversal {
  @Before('execution(*.*)')
  auditCall(context: AdviceContext) {
    const caller = context.caller || 'Unknown';
    console.log(`[AUDIT] ${caller} called ${context.methodName}`);
  }
}
```

#### With Priority

```typescript
@Transversal()
class SecurityTransversal {
  @Before('execution(*.delete*)', 100)  // High priority
  checkPermission(context: AdviceContext) {
    // Only AdminService can delete
    if (context.caller !== 'AdminService') {
      throw new Error(`Access denied: ${context.caller}`);
    }
  }
}
```

#### Targeting Specific Methods

```typescript
@Transversal()
class ValidationTransversal {
  @Before('execution(UserService.create)')
  validateUser(context: AdviceContext) {
    const [userData] = context.args;
    if (!userData.email) {
      throw new Error('Email is required');
    }
  }
}
```

#### Using Wildcards

```typescript
@Transversal()
class AuditTransversal {
  // All methods in UserService
  @Before('execution(UserService.*)')
  auditUserService(context: AdviceContext) {
    console.log('[AUDIT] UserService:', context.methodName);
  }

  // All 'save' methods in any service
  @Before('execution(*.save)')
  auditSave(context: AdviceContext) {
    console.log('[AUDIT] Save operation:', context.methodName);
  }
}
```

---

## @After

Defines an advice that executes **after** a target method completes successfully.

### Signature

```typescript
function After(pointcut: string, priority?: number): MethodDecorator
```

### Parameters

- `pointcut`: Pointcut expression matching target methods
- `priority` (optional): Execution priority, default is `0` (higher values execute first)

### Method Signature

The decorated method receives an `AdviceContext` with the result:

```typescript
methodName(context: AdviceContext): void | Promise<void>
```

### AdviceContext Properties (in addition to @Before)

- `result` - The return value of the intercepted method
- `caller` (optional) - Class name of the component that initiated the call
- `callerIdentifier` (optional) - Unique identifier for the caller

### Examples

#### Basic @After Advice

```typescript
@Transversal()
class LoggingTransversal {
  @After('execution(*.*)')
  logResult(context: AdviceContext) {
    console.log(`${context.methodName} returned:`, context.result);
  }
}
```

#### With Caller Information

```typescript
@Transversal()
class AuditTransversal {
  @After('execution(*.delete)')
  auditDeletion(context: AdviceContext) {
    const caller = context.caller || 'Unknown';
    console.log(`[AUDIT] ${caller} deleted ${context.target.constructor.name}`);
  }
}
```

#### Processing Results

```typescript
@Transversal()
class MetricsTransversal {
  private metrics = new Map<string, number>();

  @After('execution(*.find*)')
  trackQueryResults(context: AdviceContext) {
    const resultCount = Array.isArray(context.result) 
      ? context.result.length 
      : 1;
    
    this.metrics.set(context.methodName, resultCount);
  }
}
```

#### Conditional Logging

```typescript
@Transversal()
class ErrorTrackingTransversal {
  @After('execution(*.*)')
  trackSuccess(context: AdviceContext) {
    if (context.result === null || context.result === undefined) {
      console.warn(`${context.methodName} returned null/undefined`);
    }
  }
}
```

### Note on Errors

`@After` advice only runs when the method completes successfully. Use `@Around` to handle errors.

---

## @Around

Defines an advice that **wraps** a target method, providing full control over its execution.

### Signature

```typescript
function Around(pointcut: string, priority?: number): MethodDecorator
```

### Parameters

- `pointcut`: Pointcut expression matching target methods
- `priority` (optional): Execution priority, default is `0` (higher values execute first)

### Method Signature

The decorated method receives an `AdviceContext` and must call `proceed()`:

```typescript
methodName(context: AdviceContext): any | Promise<any>
```

### AdviceContext Properties (in addition to @Before/@After)

- `proceed()` - Function to invoke the next advice or original method
- `caller` (optional) - Class name of the component that initiated the call
- `callerIdentifier` (optional) - Unique identifier for the caller

### Important

**Always call `context.proceed()`** unless you intentionally want to block execution. Return the result of `proceed()` or a modified value.

### Examples

#### Basic @Around Advice

```typescript
@Transversal()
class PerformanceTransversal {
  @Around('execution(*.*)')
  async measureTime(context: AdviceContext) {
    const start = Date.now();
    
    const result = await context.proceed!();
    
    const duration = Date.now() - start;
    console.log(`${context.methodName} took ${duration}ms`);
    
    return result;
  }
}
```

#### With Caller Tracking

```typescript
@Transversal()
class DataFilteringTransversal {
  @Around('execution(*.getData)')
  async filterByRole(context: AdviceContext) {
    const data = await context.proceed!();
    
    // Different filtering based on caller
    if (context.caller === 'AdminDashboard') {
      return data; // No filtering
    } else if (context.caller === 'PublicAPI') {
      return this.filterPublic(data);
    } else {
      return [];
    }
  }
}
```

#### Error Handling

```typescript
@Transversal()
class ErrorHandlingTransversal {
  @Around('execution(*.save)')
  async handleErrors(context: AdviceContext) {
    try {
      return await context.proceed!();
    } catch (error) {
      console.error(`Error in ${context.methodName}:`, error);
      // Can return fallback value or re-throw
      throw error;
    }
  }
}
```

#### Modifying Arguments

```typescript
@Transversal()
class TransformTransversal {
  @Around('execution(*.create)')
  async addTimestamp(context: AdviceContext) {
    // Modify arguments before proceeding
    const [data] = context.args;
    context.args[0] = { ...data, createdAt: new Date() };
    
    return await context.proceed!();
  }
}
```

#### Modifying Results

```typescript
@Transversal()
class EnrichmentTransversal {
  @Around('execution(*.findById)')
  async enrichResult(context: AdviceContext) {
    const result = await context.proceed!();
    
    // Add additional data to result
    return {
      ...result,
      fetchedAt: new Date(),
      source: 'database'
    };
  }
}
```

#### Conditional Execution

```typescript
@Transversal()
class CachingTransversal {
  private cache = new Map<string, any>();

  @Around('execution(*.find*)')
  async cacheResults(context: AdviceContext) {
    const key = `${context.methodName}:${JSON.stringify(context.args)}`;
    
    // Check cache
    if (this.cache.has(key)) {
      console.log('[CACHE HIT]', key);
      return this.cache.get(key);
    }
    
    // Proceed and cache result
    const result = await context.proceed!();
    this.cache.set(key, result);
    return result;
  }
}
```

#### Retry Logic

```typescript
@Transversal()
class RetryTransversal {
  @Around('execution(*.fetch*)')
  async retryOnFailure(context: AdviceContext) {
    const maxRetries = 3;
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await context.proceed!();
      } catch (error) {
        lastError = error;
        console.log(`Retry ${i + 1}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    
    throw lastError;
  }
}
```

---

## @Affect

Explicitly applies a transversal to a specific method, bypassing automatic pointcut matching.

### Signature

```typescript
function Affect(
  transversal: Identifier<any>,
  config?: Record<string, any>
): MethodDecorator
```

### Parameters

- `transversal`: The transversal class to apply
- `config` (optional): Configuration passed to the advice via `context.config`

### Use Cases

1. **Selective application** - Apply transversal only to specific methods
2. **Override pointcuts** - Ignore pointcut expressions and force application
3. **Per-method configuration** - Pass method-specific config to transversal
4. **Combine multiple transversals** - Stack multiple @Affect decorators

### Examples

#### Basic Usage

```typescript
@Assemblage()
class UserService {
  @Affect(LoggingTransversal)
  create(name: string) {
    return { id: '1', name };
  }

  // Not affected by LoggingTransversal
  findAll() {
    return [];
  }
}
```

#### With Configuration

```typescript
@Assemblage()
class ProductService {
  @Affect(PerformanceTransversal, { threshold: 100, alert: true })
  async heavyOperation(data: any) {
    // Long-running operation
  }
}

@Transversal()
class PerformanceTransversal {
  @Around('execution(*.*)')
  async measure(context: AdviceContext) {
    const start = Date.now();
    const result = await context.proceed!();
    const duration = Date.now() - start;
    
    // Access config from @Affect
    const { threshold, alert } = context.config || {};
    
    if (threshold && duration > threshold) {
      console.warn(`Slow operation: ${duration}ms`);
      if (alert) {
        this.sendAlert(context.methodName, duration);
      }
    }
    
    return result;
  }
}
```

#### Multiple Transversals

```typescript
@Assemblage()
class OrderService {
  @Affect(LoggingTransversal)
  @Affect(ValidationTransversal)
  @Affect(SecurityTransversal, { requireAdmin: true })
  async deleteOrder(orderId: string) {
    // Critical operation with multiple concerns
  }
}
```

#### Combining with Pointcuts

```typescript
@Transversal()
class MixedTransversal {
  // Applied via pointcut to all 'create' methods
  @Before('execution(*.create)')
  autoApplied(context: AdviceContext) {
    console.log('[AUTO]', context.methodName);
  }

  // Applied only where explicitly marked with @Affect
  @Before('execution(NothingMatches.*)')
  manualApplied(context: AdviceContext) {
    console.log('[MANUAL]', context.methodName);
  }
}

@Assemblage()
class ProductService {
  // Triggers autoApplied
  create(data: any) { }

  // Triggers manualApplied via @Affect
  @Affect(MixedTransversal)
  update(id: string, data: any) { }
}
```

---

## Pointcut Syntax

All advice decorators (@Before, @After, @Around) use pointcut expressions to match methods.

### Format

```
execution(ClassName.methodName)
```

### Wildcards

- `*` - Matches any value
- `execution(*.*)` - All methods in all classes
- `execution(UserService.*)` - All methods in UserService
- `execution(*.create)` - All create methods in any class
- `execution(UserService.find*)` - All methods starting with 'find' in UserService

### Examples

```typescript
// Exact match
@Before('execution(UserService.create)')

// All methods in a class
@Before('execution(UserService.*)')

// Specific method in any class
@Before('execution(*.delete)')

// All methods everywhere (use sparingly!)
@Before('execution(*.*)')

// Methods starting with 'get'
@Before('execution(*.get*)')
```

---

## Best Practices

### 1. Create your own abstraction for Transversals

```typescript
abstract class AbstractMyTransversal implements AbstractTransversal {
    abstract myMethod(context: AdviceContext): void;
}

@Transversal()
class MyTransversal implements AbstractMyTransversal {
  onInit() {
    // Initialization logic
  }

  @Before('execution(*.*)')
  myMethod(context: AdviceContext) {
    // Advice logic
  }
}
```

### 2. Use Specific Pointcuts

```typescript
// ❌ Too broad
@Before('execution(*.*)')

// ✅ Specific
@Before('execution(UserService.create)')
```

### 3. Set Appropriate Priorities

```typescript
@Transversal()
class SecurityTransversal {
  @Before('execution(*.*)', 100)  // Security first
  checkAuth(context: AdviceContext) { }
}

@Transversal()
class ValidationTransversal {
  @Before('execution(*.*)', 50)   // Then validation
  validate(context: AdviceContext) { }
}
```

### 4. Always Call proceed() in @Around

```typescript
@Around('execution(*.*)')
async myAround(context: AdviceContext) {
  // ✅ Good
  return await context.proceed!();
  
  // ❌ Bad - method won't execute
  // return null;
}
```

### 5. Handle Errors in @Around

```typescript
@Around('execution(*.*)')
async handleErrors(context: AdviceContext) {
  try {
    return await context.proceed!();
  } catch (error) {
    // Handle or log error
    throw error;
  }
}
```

### 6. Use @Affect for Fine Control

```typescript
// Instead of complex pointcut
@Assemblage()
class Service {
  @Affect(LoggingTransversal)
  criticalMethod() { }
  
  normalMethod() { }  // Not logged
}
```

### 7. Document Transversal Behavior

```typescript
/**
 * Logs all method calls with arguments and results.
 * Applied to all methods via pointcut: execution(*.*)
 */
@Transversal()
class LoggingTransversal {
  // ...
}
```

---

## Type Safety

All decorators are fully type-safe:

```typescript
import type { AdviceContext, AbstractTransversal } from 'assemblerjs';

@Transversal()
class TypeSafeTransversal implements AbstractTransversal {
  @Before('execution(*.*)')
  typeSafeAdvice(context: AdviceContext) {
    // TypeScript ensures context has correct properties
    context.methodName;  // string
    context.args;        // any[]
    context.target;      // any
  }
}
```

---

## Next Steps

- Learn about [Transversals (AOP) concepts](../core-concepts/transversals-aop.md)
- See [Advanced Examples](../guides/advanced-examples.md) for real-world usage
- Check [API Types](../api/types.md) for AdviceContext and related types
