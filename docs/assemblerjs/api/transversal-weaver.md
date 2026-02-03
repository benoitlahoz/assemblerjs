# TransversalWeaver API

The `TransversalWeaver` class provides utilities for managing caller context in transversals and advices. It enables tracking which service or component initiated method calls, supporting both DI-managed assemblages and external callers.

## Overview

`TransversalWeaver` is useful for:
- **Audit Logging** - Track who accessed sensitive operations
- **Permission Checking** - Implement caller-based authorization
- **Request Tracing** - Correlate operations across service calls
- **Conditional Behavior** - Different logic based on caller identity

Access caller information via:
1. **In Advices** - Through `AdviceContext.caller` and `AdviceContext.callerIdentifier`
2. **In Any Code** - Via `TransversalWeaver.getCurrentCaller()`
3. **Set Context** - Using `TransversalWeaver.withCaller()`

## Static Methods

### withCaller(caller, fn)

Execute a function within a caller context. The caller information will be available to any called methods and their advices.

```typescript
static withCaller(
  caller: string | CallerMetadata,
  fn: () => T | Promise<T>
): T | Promise<T>
```

**Parameters:**
- `caller` - Class name (string) or CallerMetadata object with `className` and optional `identifier`
- `fn` - Synchronous or asynchronous function to execute

**Returns:** The result of the function (preserves async/sync behavior)

**Example (Basic):**

```typescript
import { TransversalWeaver } from 'assemblerjs';

// Set caller and execute function
const result = await TransversalWeaver.withCaller('UserEditComponent', async () => {
  return await userService.save(userData);
  // Advices will see: context.caller === 'UserEditComponent'
});
```

**Example (Vue Component):**

```typescript
export default {
  methods: {
    async updateProfile() {
      await TransversalWeaver.withCaller('ProfileEditComponent', async () => {
        await this.userService.updateProfile(this.profile);
        // Audit transversal knows this came from ProfileEditComponent
      });
    }
  }
};
```

### wrapCaller(caller, fn)

Wrap a function with caller context, returning a new function that maintains the caller on every invocation.

```typescript
static wrapCaller<T extends (...args: any[]) => any>(
  caller: string,
  fn: T
): T
```

**Parameters:**
- `caller` - Class name identifying the caller
- `fn` - Function to wrap

**Returns:** Wrapped function that maintains caller context on each call

**Example:**

```typescript
import { TransversalWeaver } from 'assemblerjs';

// Create a wrapped function
const mergeClasses = TransversalWeaver.wrapCaller(
  'LeafletMap',
  (...args: any[]) => tailwind.mergeClasses(...args)
);

// Call it multiple times - caller context is maintained each time
mergeClasses('class1', 'class2'); // Advices see: LeafletMap
mergeClasses('class3', 'class4'); // Advices see: LeafletMap
```

**Example (Vue Component):**

```typescript
export default {
  setup() {
    const saveUser = TransversalWeaver.wrapCaller(
      'UserEditForm',
      async (userData: any) => await userService.save(userData)
    );

    return { saveUser };
  }
};
```

### wrapCaller(caller, identifier, fn)

Wrap a function with both caller name and identifier.

```typescript
static wrapCaller<T extends (...args: any[]) => any>(
  caller: string,
  identifier: string | symbol,
  fn: T
): T
```

**Parameters:**
- `caller` - Class name identifying the caller
- `identifier` - Unique identifier (string, symbol, etc.)
- `fn` - Function to wrap

**Returns:** Wrapped function

**Example:**

```typescript
// Wrap with identifier
const processData = TransversalWeaver.wrapCaller(
  'DataImportService',
  'DataImportService.ts',
  (data: any[]) => dataService.bulkInsert(data)
);

// Each call maintains both caller and identifier
processData(batch1);
processData(batch2);
```

### withCaller(caller, identifier, fn)

Execute a function with both caller name and identifier for detailed tracking.

```typescript
static withCaller(
  caller: string,
  identifier: string | symbol,
  fn: () => T | Promise<T>
): T | Promise<T>
```

**Parameters:**
- `caller` - Class name identifying the caller
- `identifier` - Unique identifier (useful for request tracing)
- `fn` - Function to execute

**Returns:** The result of the function

**Example:**

```typescript
// For request tracing with correlation ID
const requestId = crypto.randomUUID();
await TransversalWeaver.withCaller('APIController', requestId, async () => {
  await service.processRequest();
  // Advices can use callerIdentifier to correlate logs
});
```

**Example (Symbols for Type Safety):**

```typescript
// Define symbol once
const IMPORT_REQUEST = Symbol('import-request');

await TransversalWeaver.withCaller('DataImportService', IMPORT_REQUEST, async () => {
  await bulkInsert(data);
  // All nested calls will carry this identifier
});
```

### getCurrentCaller()

Get the caller metadata for the current execution context. Returns `null` if no caller context is active.

```typescript
static getCurrentCaller(): CallerMetadata | null
```

**Returns:** `CallerMetadata` object with `className` and optional `identifier`, or `null`

**Example:**

```typescript
// In a service method
class UserService {
  save(user: any) {
    const caller = TransversalWeaver.getCurrentCaller();
    
    if (caller) {
      console.log(`Save initiated by: ${caller.className}`);
      if (caller.identifier) {
        console.log(`Request ID: ${caller.identifier}`);
      }
    }
    
    // ... save logic
  }
}
```

**Example (Conditional Behavior):**

```typescript
class ProductService {
  getProducts() {
    const caller = TransversalWeaver.getCurrentCaller();
    
    // Different behavior based on caller
    if (caller?.className === 'AdminDashboard') {
      return this.getAllProductsUnfiltered(); // Full data
    } else {
      return this.getPublicProducts(); // Filtered data
    }
  }
}
```

## Types

### CallerMetadata

```typescript
interface CallerMetadata {
  className: string;           // Name of the calling class/component
  identifier?: string | symbol; // Optional unique identifier
}
```

## Usage Patterns

### 1. Audit Logging

Track all operations and who initiated them:

```typescript
@Transversal()
class AuditTransversal implements AbstractTransversal {
  constructor(private auditLog: AuditLogService) {}

  @Before('execution(*.create)')
  @Before('execution(*.update)')
  @Before('execution(*.delete)')
  logOperation(context: AdviceContext) {
    const operation = `${context.target.constructor.name}.${context.methodName}`;
    const caller = context.caller || 'Unknown';
    
    this.auditLog.record({
      timestamp: new Date(),
      operation,
      caller,
      args: JSON.stringify(context.args),
    });
  }
}
```

### 2. Authorization

Restrict operations based on caller:

```typescript
@Transversal()
class AuthorizationTransversal {
  @Before('execution(*.delete)', 100) // High priority
  checkDeletePermission(context: AdviceContext) {
    const allowedDeleters = ['AdminService', 'MaintenanceService'];
    
    if (context.caller && !allowedDeleters.includes(context.caller)) {
      throw new UnauthorizedError(
        `${context.caller} is not authorized to delete`
      );
    }
  }
}
```

### 3. Request Tracing

Correlate operations across services using request IDs:

```typescript
@Transversal()
class RequestTracingTransversal {
  @Before('execution(*.*)')
  traceRequest(context: AdviceContext) {
    const requestId = context.callerIdentifier || 'unknown';
    const service = context.target.constructor.name;
    const method = context.methodName;
    
    console.log(`[${requestId}] ${context.caller} → ${service}.${method}`);
  }
}

// Usage in controller
class OrderController {
  async createOrder(orderData: any) {
    const requestId = crypto.randomUUID();
    
    await TransversalWeaver.withCaller('OrderAPI', requestId, async () => {
      const order = await this.orderService.create(orderData);
      // All nested calls will log with the same requestId
      const email = await this.emailService.sendConfirmation(order);
      return order;
    });
  }
}
```

### 4. Conditional Transversal Behavior

Apply different logic based on who calls:

```typescript
@Transversal()
class DataFiltering {
  @Around('execution(*.getData)')
  async filterByRole(context: AdviceContext) {
    const data = await context.proceed!();
    
    // Different filtering based on caller
    switch (context.caller) {
      case 'AdminDashboard':
        return data; // No filtering
      case 'PublicAPI':
        return this.filterPublic(data);
      case 'UserProfile':
        return this.filterByUser(data);
      default:
        return [];
    }
  }
}
```

### 5. External Component Integration

Track calls from UI frameworks (Vue, React, etc.):

```typescript
// Vue 3 composable
export function useUserService() {
  const userService = inject(UserService);
  
  return {
    async createUser(userData: any) {
      return TransversalWeaver.withCaller(
        'UserManagementView',
        async () => {
          return await userService.create(userData);
        }
      );
    },
    
    async deleteUser(id: string) {
      return TransversalWeaver.withCaller(
        'UserManagementView',
        async () => {
          return await userService.delete(id);
        }
      );
    }
  };
}
```

## Important Notes

1. **Works Without Transversals** - Caller context is independent of transversals being engaged. `withCaller()` and `getCurrentCaller()` work even if no advices are configured.

2. **Async Support** - `withCaller()` properly handles both synchronous and asynchronous functions, maintaining caller context through Promise chains.

3. **Automatic for DI Services** - When calling between DI-managed assemblages, the caller is automatically tracked via WeakMap registry. `withCaller()` is needed for external callers (Vue components, Node.js scripts, etc.).

4. **Context Isolation** - Each call to `withCaller()` creates a new context. Nested calls stack properly.

5. **Null Identifier is Allowed** - If no identifier is needed, just use `withCaller(callerName, fn)`. The identifier is optional.

## Examples

### Complete Example: Request Processing

```typescript
// Service with audit and authorization
@Assemblage({
  inject: [[Database], [AuditLog], [Permission]],
  engage: [[AuditTransversal], [AuthorizationTransversal]]
})
class SensitiveDataService {
  constructor(
    private db: Database,
    private audit: AuditLog,
    private permission: Permission
  ) {}

  async deleteUserData(userId: string) {
    // This method will be intercepted by:
    // 1. AuthorizationTransversal (checks permission)
    // 2. AuditTransversal (logs the operation)
    // Both advices can access context.caller
    return await this.db.delete('users', userId);
  }
}

// External API handling the request
class APIController {
  constructor(private dataService: SensitiveDataService) {}

  async handleDeleteRequest(request: any) {
    const requestId = request.headers['x-request-id'];
    
    return TransversalWeaver.withCaller(
      'SecurityAuditAPI',
      requestId,
      async () => {
        // Advices will see:
        // - context.caller === 'SecurityAuditAPI'
        // - context.callerIdentifier === requestId
        return await this.dataService.deleteUserData(request.userId);
      }
    );
  }
}
```

## See Also

- [Transversals & AOP](../core-concepts/transversals-aop.md)
- [AdviceContext Type](./types.md#advicecontext)
- [AOP Decorators](../decorators/aop-decorators.md)
