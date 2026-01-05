# Custom Parameter Decorators

The `ParameterDecoratorFactory` makes creating custom parameter decorators effortless.

## Quick Example

Create a custom decorator in just 5 lines:

```typescript
import { ParameterDecoratorFactory, ParameterResolver } from 'assemblerjs';

// 1. Create a resolver
class LoggerResolver implements ParameterResolver {
  resolve(value: string, context: AssemblerContext): any {
    // Return the logger instance for the given name
    return new Logger(value);
  }
}

// 2. Create the decorator
export const Logger = ParameterDecoratorFactory.create<string>({
  name: 'Logger',
  valueType: 'map',
  resolver: LoggerResolver,
});

// 3. Use it in your classes
@Assemblage()
export class MyService implements AbstractAssemblage {
  constructor(@Logger('app') private logger: Logger) {
    this.logger.info('Service created');
  }
}
```

## How It Works

The factory automatically:
- Registers the resolver
- Generates reflection metadata keys
- Handles parameter storage
- Maintains type safety

## ValueType Options

### 'single' - Single Value

One value per decorator instance:

```typescript
class ApiKeyResolver implements ParameterResolver {
  resolve(value: string, context: AssemblerContext): string {
    return process.env[value] || '';
  }
}

const Env = ParameterDecoratorFactory.create<string>({
  name: 'Env',
  valueType: 'single',
  resolver: ApiKeyResolver,
});

// Usage
@Assemblage()
class ApiService implements AbstractAssemblage {
  constructor(@Env('API_KEY') private apiKey: string) {}
}
```

### 'array' - Multiple Values

Multiple values as an array:

```typescript
class MultiLoggerResolver implements ParameterResolver {
  resolve(values: string[], context: AssemblerContext): Logger[] {
    return values.map(name => new Logger(name));
  }
}

const Loggers = ParameterDecoratorFactory.create<string[]>({
  name: 'Loggers',
  valueType: 'array',
  resolver: MultiLoggerResolver,
});

// Usage
@Assemblage()
class MultiService implements AbstractAssemblage {
  constructor(@Loggers(['app', 'db', 'api']) private loggers: Logger[]) {}
}
```

### 'map' - Key-Value Mapping

Key-value pairs:

```typescript
class ConfigResolver implements ParameterResolver {
  resolve(key: string, context: AssemblerContext): any {
    return context.global(key);
  }
}

const Config = ParameterDecoratorFactory.create<string>({
  name: 'Config',
  valueType: 'map',
  resolver: ConfigResolver,
});

// Usage
@Assemblage({
  global: { dbUrl: 'postgresql://localhost/mydb' },
})
class DatabaseService implements AbstractAssemblage {
  constructor(@Config('dbUrl') private url: string) {}
}
```

## Complete Example: Database Connection

```typescript
// Define connection config
interface DbConfig {
  host: string;
  port: number;
  database: string;
}

// Resolver that creates connections
class DbConnectionResolver implements ParameterResolver {
  private connections = new Map<string, DbConnection>();
  
  resolve(name: string, context: AssemblerContext): DbConnection {
    if (!this.connections.has(name)) {
      // Get config from global values
      const config: DbConfig = context.global(`db:${name}`);
      
      // Create and cache connection
      const connection = new DbConnection(config);
      this.connections.set(name, connection);
    }
    
    return this.connections.get(name)!;
  }
}

// Create the decorator
export const Database = ParameterDecoratorFactory.create<string>({
  name: 'Database',
  valueType: 'map',
  resolver: DbConnectionResolver,
});

// Register database configs
@Assemblage({
  global: {
    'db:main': { host: 'localhost', port: 5432, database: 'app' },
    'db:analytics': { host: 'localhost', port: 5433, database: 'analytics' },
  },
})
class Application implements AbstractAssemblage {
  constructor(
    @Database('main') private mainDb: DbConnection,
    @Database('analytics') private analyticsDb: DbConnection
  ) {}
}
```

## Advanced: Async Resolver

Resolvers can be asynchronous:

```typescript
class AsyncApiClientResolver implements ParameterResolver {
  async resolve(endpoint: string, context: AssemblerContext): Promise<ApiClient> {
    const client = new ApiClient(endpoint);
    await client.authenticate();
    return client;
  }
}

const ApiClient = ParameterDecoratorFactory.create<string>({
  name: 'ApiClient',
  valueType: 'single',
  resolver: AsyncApiClientResolver,
});
```

## Type Safety

Generic type parameter ensures type safety:

```typescript
// Typed resolver
class TypedResolver implements ParameterResolver {
  resolve(value: number, context: AssemblerContext): string {
    return `Value: ${value}`;
  }
}

// Create with type <number>
const Typed = ParameterDecoratorFactory.create<number>({
  name: 'Typed',
  valueType: 'single',
  resolver: TypedResolver,
});

// Usage
@Assemblage()
class TypedService implements AbstractAssemblage {
  constructor(@Typed(42) private value: string) {
    // value is typed as string (resolver return type)
  }
}
```

## ParameterResolver Interface

```typescript
interface ParameterResolver {
  resolve(value: any, context: AssemblerContext): any | Promise<any>;
}
```

**Parameters:**
- `value` - The value passed to the decorator
- `context` - AssemblerContext for accessing container methods

**Returns:**
- Any value (can be async with `Promise`)

## Factory Options

```typescript
interface ParameterDecoratorOptions<T> {
  name: string;           // Unique name for the decorator
  valueType: 'single' | 'array' | 'map'; // How values are stored
  resolver: ParameterResolver; // Class that resolves values
}
```

## Best Practices

1. **Unique Names** - Use descriptive, unique names to avoid conflicts
2. **Caching** - Cache expensive operations in resolvers
3. **Error Handling** - Handle errors gracefully in resolvers
4. **Type Safety** - Always specify generic types
5. **Documentation** - Document expected value types and behavior

## Next Steps

- [Custom Class Decorators](./custom-class.md) - Create type-safe class decorators
- [Parameter Decorators](./parameter-decorators.md) - Built-in decorators
- [AssemblerContext API](../api/context.md) - Context methods for resolvers
- [Advanced Examples](../guides/advanced-examples.md) - Real-world decorator examples
