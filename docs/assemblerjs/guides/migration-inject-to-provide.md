# Migration Guide: `inject` → `provide`

## Overview

The `inject` option in the `@Assemblage` decorator has been deprecated in favor of `provide`. This change improves semantic clarity: you **provide** dependencies to a class rather than **inject** them.

## Why the Change?

The term "provide" better describes what happens at the decorator level:
- You **provide** a list of dependencies that the class needs
- The DI container **injects** those dependencies into the constructor

This aligns better with dependency injection terminology used in other frameworks.

## Backward Compatibility

✅ **Your existing code continues to work** - No breaking changes  
⚠️ **Console warnings** will appear when using `inject`  
🔮 **Future removal** - `inject` will be removed in a future major version

## Migration Steps

### Before (Deprecated)
```typescript
@Assemblage({
  inject: [[Logger], [Database]]
})
class UserService {
  constructor(
    private logger: Logger,
    private database: Database
  ) {}
}
```

### After (Recommended)
```typescript
@Assemblage({
  provide: [[Logger], [Database]]
})
class UserService {
  constructor(
    private logger: Logger,
    private database: Database
  ) {}
}
```

## Examples

### Simple Dependency

**Before:**
```typescript
@Assemblage({
  inject: [[ConcreteService]]
})
class MyApp implements AbstractAssemblage {
  constructor(private service: ConcreteService) {}
}
```

**After:**
```typescript
@Assemblage({
  provide: [[ConcreteService]]
})
class MyApp implements AbstractAssemblage {
  constructor(private service: ConcreteService) {}
}
```

### With Abstraction

**Before:**
```typescript
@Assemblage({
  inject: [[AbstractLogger, ConsoleLogger]]
})
class MyApp implements AbstractAssemblage {
  constructor(private logger: AbstractLogger) {}
}
```

**After:**
```typescript
@Assemblage({
  provide: [[AbstractLogger, ConsoleLogger]]
})
class MyApp implements AbstractAssemblage {
  constructor(private logger: AbstractLogger) {}
}
```

### With Configuration

**Before:**
```typescript
@Assemblage({
  inject: [[DatabaseService, { host: 'localhost', port: 5432 }]]
})
class MyApp implements AbstractAssemblage {
  constructor(private db: DatabaseService) {}
}
```

**After:**
```typescript
@Assemblage({
  provide: [[DatabaseService, { host: 'localhost', port: 5432 }]]
})
class MyApp implements AbstractAssemblage {
  constructor(private db: DatabaseService) {}
}
```

### Multiple Dependencies

**Before:**
```typescript
@Assemblage({
  inject: [
    [Logger],
    [DatabaseService],
    [CacheService]
  ]
})
class MyApp implements AbstractAssemblage {
  constructor(
    private logger: Logger,
    private db: DatabaseService,
    private cache: CacheService
  ) {}
}
```

**After:**
```typescript
@Assemblage({
  provide: [
    [Logger],
    [DatabaseService],
    [CacheService]
  ]
})
class MyApp implements AbstractAssemblage {
  constructor(
    private logger: Logger,
    private db: DatabaseService,
    private cache: CacheService
  ) {}
}
```

## Automated Migration

You can use a simple search and replace in your IDE:

**Find:**
```regex
inject:\s*\[
```

**Replace with:**
```
provide: [
```

This will update all occurrences in your codebase.

## Transition Behavior

If both options are present, `provide` takes precedence:

```typescript
@Assemblage({
  inject: [[OldService]],   // ⚠️ Ignored
  provide: [[NewService]]   // ✅ Used
})
class MyService {
  constructor(private service: NewService) {} // NewService is injected
}
```

A console warning will notify you of this situation.

## Deprecation Timeline

- **Current Version**: `provide` introduced, `inject` deprecated with warnings
- **Future Major Version**: `inject` will be completely removed

## FAQ

### Q: Do I need to migrate immediately?
**A:** No, but it's recommended. Your code will continue working, but you'll see deprecation warnings in the console.

### Q: Is there any behavioral difference?
**A:** No. `provide` works exactly like `inject`. It's purely a semantic improvement.

### Q: What happens if I use both?
**A:** `provide` takes priority, and you'll see a warning. Choose one or the other.

### Q: How do I silence the warnings?
**A:** Replace all `inject:` with `provide:` in your `@Assemblage` decorators.

### Q: Will TypeScript autocomplete work?
**A:** Yes! Full TypeScript support is maintained for both options during the transition period.

## Need Help?

If you encounter any issues during migration, please:
- Check the [Dependency Injection](../core-concepts/dependency-injection.md) guide
- Review the [Assemblage](../core-concepts/assemblage.md) documentation
- Open an issue on GitHub
