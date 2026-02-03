# Caller Tracking in Transversals

A comprehensive guide to using caller tracking in assembler.js transversals for audit logging, authorization, and request tracing.

## Overview

Caller tracking allows you to identify which service or component initiated a method call. This is useful for:

- **Audit Logging** - Track sensitive operations and who performed them
- **Authorization** - Implement caller-based access control
- **Request Tracing** - Correlate operations across services using request IDs
- **Analytics** - Track feature usage by caller
- **Conditional Logic** - Apply different behavior based on the caller

## The Caller Context

Every advice receives caller information through `AdviceContext`:

```typescript
interface AdviceContext extends JoinPoint {
  caller?: string;                  // Class name of the caller
  callerIdentifier?: string | symbol; // Optional unique identifier
}
```

- **Automatic Tracking** - For DI-managed services, the caller is automatically detected
- **Manual Tracking** - For external callers (Vue components, scripts), use `TransversalWeaver.withCaller()`
- **Works Without Transversals** - Caller context is independent of advices

## Scenario 1: Audit Logging

Track all sensitive operations with caller information.

### Implementation

```typescript
import { Transversal, Before, type AdviceContext } from 'assemblerjs';

interface AuditLog {
  timestamp: Date;
  operation: string;
  caller: string;
  targetClass: string;
  method: string;
  success: boolean;
  error?: string;
}

@Transversal()
class AuditTransversal {
  private logs: AuditLog[] = [];

  @Before('execution(*.create)', 100)
  @Before('execution(*.update)', 100)
  @Before('execution(*.delete)', 100)
  logOperation(context: AdviceContext) {
    const caller = context.caller || 'Unknown';
    const targetClass = context.target.constructor.name;
    
    console.log(`[AUDIT] ${caller} → ${targetClass}.${context.methodName}`);
    
    // Store in audit trail for later review
    this.logs.push({
      timestamp: new Date(),
      operation: `${targetClass}.${context.methodName}`,
      caller,
      targetClass,
      method: context.methodName,
      success: true
    });
  }

  @Before('execution(*.delete)', 200) // High priority to catch errors
  logDeletion(context: AdviceContext) {
    const caller = context.caller || 'Unknown';
    if (!this.canDelete(caller)) {
      console.error(`[AUDIT DENIED] ${caller} attempted unauthorized deletion`);
      throw new UnauthorizedError(`${caller} cannot delete`);
    }
  }

  private canDelete(caller: string): boolean {
    const allowedDeleters = ['AdminService', 'MaintenanceService', 'SystemAdmin'];
    return allowedDeleters.includes(caller);
  }

  getLogs(): AuditLog[] {
    return [...this.logs];
  }
}
```

### Using the Audit Transversal

```typescript
@Assemblage({
  inject: [[Database]],
  engage: [[AuditTransversal]]
})
class UserService {
  constructor(private db: Database) {}

  create(user: any) {
    return this.db.insert('users', user);
  }

  update(id: string, user: any) {
    return this.db.update('users', id, user);
  }

  delete(id: string) {
    // Will be intercepted by AuditTransversal
    return this.db.delete('users', id);
  }
}

// Usage
@Assemblage({
  inject: [[UserService]]
})
class AdminService {
  constructor(private userService: UserService) {}

  async manageUser(id: string) {
    // This delete will be logged as coming from AdminService
    await this.userService.delete(id);
  }
}
```

## Scenario 2: Authorization Based on Caller

Different access levels for different callers.

### Implementation

```typescript
@Transversal()
class AuthorizationTransversal {
  private permissions = new Map<string, Set<string>>([
    ['AdminService', new Set(['read', 'write', 'delete'])],
    ['UserService', new Set(['read', 'write'])],
    ['PublicAPI', new Set(['read'])],
    ['ReportService', new Set(['read'])]
  ]);

  @Before('execution(*.delete)', 100) // High priority
  checkDeletePermission(context: AdviceContext) {
    const caller = context.caller || 'Unknown';
    const allowed = this.permissions.get(caller)?.has('delete');

    if (!allowed) {
      throw new UnauthorizedError(
        `${caller} is not authorized to perform delete operations`
      );
    }
  }

  @Before('execution(*.write)', 100)
  checkWritePermission(context: AdviceContext) {
    const caller = context.caller || 'Unknown';
    const allowed = this.permissions.get(caller)?.has('write');

    if (!allowed) {
      throw new UnauthorizedError(
        `${caller} is not authorized to perform write operations`
      );
    }
  }
}

// Usage
@Assemblage({
  inject: [[Database]],
  engage: [[AuthorizationTransversal]]
})
class SensitiveDataService {
  constructor(private db: Database) {}

  read(id: string) {
    return this.db.find('sensitive', id);
  }

  write(id: string, data: any) {
    return this.db.update('sensitive', id, data);
  }

  delete(id: string) {
    return this.db.delete('sensitive', id);
  }
}

// Only AdminService can delete
await adminService.deleteSensitiveData(id); // ✓ Success

// PublicAPI cannot delete
await publicAPI.deleteSensitiveData(id); // ✗ UnauthorizedError
```

## Scenario 3: Request Tracing

Track requests across multiple services using request IDs.

### Implementation

```typescript
@Transversal()
class RequestTracingTransversal {
  @Before('execution(*.*)')
  traceRequest(context: AdviceContext) {
    const requestId = context.callerIdentifier
      ? `[${String(context.callerIdentifier)}]`
      : '';

    const caller = context.caller || 'Unknown';
    const service = context.target.constructor.name;
    const method = context.methodName;

    console.log(`${requestId} ${caller} → ${service}.${method}`);
  }
}

// Usage with UUID for request tracking
class APIController {
  constructor(
    private orderService: OrderService,
    private paymentService: PaymentService,
    private notificationService: NotificationService
  ) {}

  async processOrder(orderData: any) {
    const requestId = crypto.randomUUID();

    return TransversalWeaver.withCaller(
      'OrderAPI',
      requestId,
      async () => {
        // All calls within this block will have requestId
        const order = await this.orderService.create(orderData);
        const payment = await this.paymentService.process(order);
        await this.notificationService.sendConfirmation(order);

        return order;
      }
    );
  }
}

// Console output:
// [f47ac10b-58cc-4372-a567-0e02b2c3d479] OrderAPI → OrderService.create
// [f47ac10b-58cc-4372-a567-0e02b2c3d479] OrderService → OrderRepository.save
// [f47ac10b-58cc-4372-a567-0e02b2c3d479] OrderAPI → PaymentService.process
// [f47ac10b-58cc-4372-a567-0e02b2c3d479] PaymentService → PaymentGateway.charge
// [f47ac10b-58cc-4372-a567-0e02b2c3d479] OrderAPI → NotificationService.sendConfirmation
```

## Scenario 4: Vue Component Integration

Track calls from UI components to services.

### Vue 3 Composable

```typescript
// useUserService.ts
import { TransversalWeaver } from 'assemblerjs';
import { inject } from 'vue';
import type { UserService } from '@/services';

export function useUserService() {
  const userService = inject<UserService>('userService')!;

  return {
    async listUsers() {
      return TransversalWeaver.withCaller(
        'UserListComponent',
        async () => {
          return await userService.findAll();
        }
      );
    },

    async createUser(userData: any) {
      return TransversalWeaver.withCaller(
        'UserCreateDialog',
        async () => {
          return await userService.create(userData);
        }
      );
    },

    async updateUser(id: string, userData: any) {
      return TransversalWeaver.withCaller(
        'UserEditComponent',
        async () => {
          return await userService.update(id, userData);
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

// UserListComponent.vue
<script setup lang="ts">
const { listUsers } = useUserService();

async function load() {
  users.value = await listUsers();
  // Audit logs will show: UserListComponent → UserService.findAll()
}
</script>
```

## Scenario 5: Conditional Behavior by Caller

Apply different logic based on who calls the method.

### Implementation

```typescript
@Transversal()
class DataAccessTransversal {
  @Around('execution(UserService.find*)')
  async filterDataByRole(context: AdviceContext) {
    const data = await context.proceed!();

    // Different filtering based on caller
    switch (context.caller) {
      case 'AdminDashboard':
        return data; // No filtering, show everything

      case 'PublicAPI':
        return this.filterPublicData(data);

      case 'UserProfile':
        return this.filterUserPersonalData(data);

      default:
        return []; // Deny by default
    }
  }

  private filterPublicData(users: any[]) {
    return users.map(user => ({
      id: user.id,
      name: user.name,
      // Hide sensitive fields
    }));
  }

  private filterUserPersonalData(users: any[]) {
    const currentUserId = this.getCurrentUserId();
    return users.filter(user => user.id === currentUserId);
  }

  private getCurrentUserId(): string {
    // Get from context or request
    return 'current-user-id';
  }
}

// Usage
const adminData = await TransversalWeaver.withCaller('AdminDashboard', async () => {
  return await userService.findAll(); // Returns all users
});

const publicData = await TransversalWeaver.withCaller('PublicAPI', async () => {
  return await userService.findAll(); // Returns filtered public data
});
```

## Best Practices

### 1. Always Name Your Callers Clearly

```typescript
// ✓ Good - Clear, descriptive names
TransversalWeaver.withCaller('OrderCheckoutComponent', async () => {});
TransversalWeaver.withCaller('AdminDashboard', async () => {});

// ✗ Bad - Too generic
TransversalWeaver.withCaller('Component', async () => {});
TransversalWeaver.withCaller('API', async () => {});
```

### 2. Use Identifiers for Request Tracing

```typescript
// ✓ Good - Unique request ID for correlation
const requestId = crypto.randomUUID();
TransversalWeaver.withCaller('APIController', requestId, async () => {});

// ✓ Also good - Symbols for type safety
const IMPORT_REQUEST = Symbol('import-request');
TransversalWeaver.withCaller('DataImportService', IMPORT_REQUEST, async () => {});
```

### 3. Leverage Priorities in Advices

```typescript
@Transversal()
class TransversalStack {
  // Security check first (highest priority)
  @Before('execution(*.sensitive)', 200)
  checkSecurity(context: AdviceContext) {}

  // Then validation
  @Before('execution(*.sensitive)', 100)
  validate(context: AdviceContext) {}

  // Finally logging
  @Before('execution(*.sensitive)', 0)
  log(context: AdviceContext) {}
}
```

### 4. Handle Caller-Based Errors Gracefully

```typescript
@Transversal()
class ErrorHandlingTransversal {
  @Around('execution(*.criticalOperation)')
  async handleErrors(context: AdviceContext) {
    try {
      return await context.proceed!();
    } catch (error) {
      const caller = context.caller || 'Unknown';
      console.error(`Error in ${caller}: ${error.message}`);
      // Different error handling based on caller
      if (caller === 'PublicAPI') {
        throw new PublicError('Operation failed');
      } else {
        throw error; // Re-throw for internal callers
      }
    }
  }
}
```

## Summary

Caller tracking in assembler.js enables powerful cross-cutting concerns:

| Use Case | Implementation |
|----------|-------------------|
| Audit Logging | Use `context.caller` in `@Before` advice |
| Authorization | Check `context.caller` and throw errors |
| Request Tracing | Use `callerIdentifier` to correlate calls |
| Conditional Logic | Use `@Around` and check `context.caller` |
| UI Component Tracking | Wrap UI calls with `TransversalWeaver.withCaller()` |

For external callers (Vue, React, Node scripts), use:

```typescript
TransversalWeaver.withCaller('CallerName', async () => {
  // Your code here
});
```

For automatic tracking of DI services, just register transversals and the caller will be automatically detected!
