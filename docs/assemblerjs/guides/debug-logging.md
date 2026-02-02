# Debug Logging & Cycle Detection

AssemblerJS provides a powerful debug logging system to diagnose dependency injection issues, especially during development and troubleshooting minified code.

## Enabling Debug Mode

Enable debug logging with optional configuration:

```typescript
import { Assembler } from 'assemblerjs';

// Enable debug logging with all features
Assembler.enableDebug({
  enabled: true,
  logPhases: {
    registration: true,
    registrationUse: true,
    registrationGlobals: true,
    resolution: true,
    construction: true,
    hooks: true,
    injectionUse: true,
    injectionGlobal: true,
  },
  logTimings: true,
  useColors: true,
  detectCycles: false, // Disabled by default (opt-in)
});

// Build your assemblage
const app = Assembler.build(MyAssemblage);

// Disable when done
Assembler.disableDebug();
```

### Debug Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | true | Enable/disable debug logging |
| `logger` | function | console | Custom logger function |
| `logPhases` | object | all true | Control which phases to log |
| `logTimings` | boolean | false | Include timing information |
| `logDependencyTree` | boolean | true | Log dependency relationships |
| `useColors` | boolean | true | Colorize console output |
| `detectCycles` | boolean | false | Enable early cycle detection |

## Debug Logger Features

The debug logger provides detailed information about each phase:

### Registration Phase

Logs all registered identifiers after the registration is complete:

```
[registration ended]
registered: [UserService, AuthService, DatabaseService]
```

### Resolution Phase

Logs dependency resolution attempts:

```
[resolution started]
[resolution ended]
```

### Hook Execution

Logs lifecycle hooks as they execute:

```
[hooks:onInit started]
[hooks:onInit ended]
[hooks:onInited started]
[hooks:onInited ended]
```

### Timing Information

When `logTimings: true`, includes build duration:

```
[Build started] Entry: MyAssemblage
[Build ended] Duration: 12.5ms
```

## Error Diagnostics

When a dependency cannot be resolved, the error log includes detailed information to help troubleshoot, especially with minified code:

```typescript
Assembler.enableDebug({
  logger: (level, message, data) => {
    if (level === 'error') {
      console.error(`${message}:`, data);
    }
  }
});
```

### Error Log Structure

```json
{
  "level": "error",
  "message": "Dependency not registered",
  "data": {
    "identifier": "UserService",
    "caller": "UserController",
    "type": "class",
    "paramIndex": 0,
    "paramCount": 2,
    "expectedType": "UserService",
    "error": "Dependency 'UserService' has not been registered..."
  }
}
```

### Error Diagnostic Fields

- **identifier**: The class/service that was not found
- **caller**: The class requesting the dependency
- **type**: Type of identifier (class, function, string, symbol, object)
- **paramIndex**: Position of the parameter in constructor (0-based, useful for minified code)
- **paramCount**: Total number of constructor parameters
- **expectedType**: Expected type from TypeScript metadata (preserved even when minified)
- **error**: Human-readable error message

### Handling Minified Code

When your code is minified, class names become single letters. AssemblerJS helps by including the parameter index and expected type:

**Before minification:**
```typescript
class UserController {
  constructor(private userService: UserService) {} // parameter 0, type UserService
}
```

**After minification (Terser/SWC):**
```typescript
class a { 
  constructor(private b: c) {} // names are shortened
}
```

**Debug log shows:**
```json
{
  "paramIndex": 0,
  "paramCount": 1,
  "expectedType": "UserService"  // Preserved from TypeScript metadata!
}
```

## Early Cycle Detection

AssemblerJS can detect circular dependencies **before** attempting resolution, preventing stack overflow errors.

### Enabling Cycle Detection

```typescript
// Enable cycle detection (disabled by default for performance)
Assembler.enableDebug({
  detectCycles: true,
});

// ServiceA → ServiceB → ServiceC → ServiceA
const app = Assembler.build(MyAssemblage); // Throws with cycle info
```

### Cycle Detection Example

Define a circular dependency:

```typescript
abstract class AbstractServiceA implements AbstractAssemblage {
  abstract doA(): void;
}

abstract class AbstractServiceB implements AbstractAssemblage {
  abstract doB(): void;
}

class ServiceA extends AbstractServiceA {
  constructor(public b: AbstractServiceB) { super(); }
  doA(): void {}
}

class ServiceB extends AbstractServiceB {
  constructor(public a: AbstractServiceA) { super(); }
  doB(): void {}
}

@Assemblage({
  inject: [
    [AbstractServiceA, ServiceA],
    [AbstractServiceB, ServiceB],
  ],
})
class App implements AbstractAssemblage {
  constructor(public serviceA: AbstractServiceA) {}
}

Assembler.enableDebug({ detectCycles: true });
Assembler.build(App); // Error: Circular dependency detected
```

### Cycle Detection Log

When a cycle is detected, the log includes the complete path:

```json
{
  "level": "error",
  "message": "Circular dependency detected",
  "data": {
    "cycle": ["ServiceA", "ServiceB"],
    "path": "ServiceA → ServiceB → ServiceA"
  }
}
```

For complex 3+ level cycles:

```json
{
  "cycle": ["ServiceA", "ServiceB", "ServiceC"],
  "path": "ServiceA → ServiceB → ServiceC → ServiceA"
}
```

### Performance Note

Cycle detection has a small performance cost (graph analysis). Enable it only during development/debugging. It's disabled by default for production performance.

## Custom Logger

Provide your own logger function for integration with logging services:

```typescript
Assembler.enableDebug({
  logger: (level, message, data) => {
    // Send to your logging service
    myLoggingService.log({
      level,
      message,
      metadata: data,
      timestamp: new Date().toISOString(),
    });
  },
});
```

### Logger Function Signature

```typescript
type DebugLogger = (
  level: 'info' | 'warn' | 'error',
  message: string,
  data?: any
) => void;
```

## Zero Overhead When Disabled

The debug system uses the **NoOp pattern** for zero overhead when disabled:

- When `enableDebug()` is not called, debug logger uses empty no-op implementation
- When `detectCycles: false` (default), cycle detector uses empty no-op implementation
- No `if` statements throughout the codebase, no performance penalty
- Simply enable when needed for debugging

This ensures production builds have **zero performance impact** from the debug system.

## Debugging Workflow

### 1. Enable Debug Mode

```typescript
Assembler.enableDebug({
  enabled: true,
  detectCycles: true,
  logTimings: true,
});
```

### 2. Capture Logs

```typescript
const logs: any[] = [];

Assembler.enableDebug({
  logger: (level, message, data) => {
    logs.push({ level, message, data });
    console.log(`[${level}] ${message}`, data);
  },
});
```

### 3. Analyze Errors

Look for logs with `level: 'error'`:

```typescript
const errorLogs = logs.filter(log => log.level === 'error');
errorLogs.forEach(log => {
  console.error(`${log.message}:`, log.data);
});
```

### 4. Fix Issues

Common issues and solutions:

| Issue | Solution |
|-------|----------|
| Dependency not registered | Add to `inject` array in `@Assemblage` |
| Circular dependency | Refactor to break the cycle or use a factory pattern |
| Minified class names | Use `expectedType` field from error log |
| Parameter injection fails | Check `paramIndex` to find which parameter failed |

## Advanced Examples

### Detecting All Circular Dependencies

```typescript
Assembler.enableDebug({
  detectCycles: true,
  logger: (level, message, data) => {
    if (message === 'Circular dependency detected') {
      console.warn(`Cycle detected: ${data.path}`);
    }
  },
});
```

### Logging Only Errors

```typescript
Assembler.enableDebug({
  logPhases: {
    registration: false,
    resolution: false,
    hooks: false,
  },
  logger: (level, message, data) => {
    if (level === 'error') {
      console.error(message, data);
    }
  },
});
```

### Integration with Sentry/Rollbar

```typescript
Assembler.enableDebug({
  logger: (level, message, data) => {
    if (level === 'error') {
      Sentry.captureMessage(`DI Error: ${message}`, 'error', {
        extra: data,
      });
    }
  },
});
```

## See Also

- [Error Handling](./error-handling.md)
- [Advanced Examples](./advanced-examples.md)
- [Troubleshooting Guide](./troubleshooting.md)
