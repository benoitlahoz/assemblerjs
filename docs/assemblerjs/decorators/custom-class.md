# Custom Class Decorators

The `createConstructorDecorator` function allows you to create **type-safe** custom class decorators that can be stacked with `@Assemblage`. These decorators execute code after the constructor and can access all injected dependencies.

## Key Features

- 🔒 **Fully type-safe** with TypeScript generics
- 📍 Can be placed **above** or **below** `@Assemblage` decorator
- 🔄 Automatically preserves parameter decorators (`@Context()`, `@Use()`, etc.)
- ✏️ Type-safe access to `this` to modify the instance
- ⚙️ Receives a typed optional configuration object

## Basic Type-Safe Example

```typescript
import { createConstructorDecorator, Assemblage, AbstractAssemblage } from 'assemblerjs';

// 1. Define your configuration interface
interface LoggerConfig {
  prefix: string;
  enabled: boolean;
}

// 2. Create a type-safe decorator
// TInstance = your class type, TDefinition = config type
const Logger = createConstructorDecorator<MyService, LoggerConfig>(function(config) {
  // ⚠️ IMPORTANT: Use 'function', NOT arrow function to access 'this'
  // `this` is now typed as MyService
  // `config` is typed as LoggerConfig | undefined
  
  if (config?.enabled) {
    this.logPrefix = config.prefix;
    console.log(`[${this.logPrefix}] Instance created`);
  }
});

// 3. Use it with your class
@Logger({ prefix: 'APP', enabled: true })
@Assemblage()
class MyService implements AbstractAssemblage {
  logPrefix?: string; // Add property for type safety
  
  doSomething() {
    console.log(`[${this.logPrefix}] Doing something`);
  }
}
```

## Advanced Type-Safe Example with Parameter Decorators

```typescript
// Define configuration and extended interface
interface TrackerConfig {
  trackInit: boolean;
  trackDispose: boolean;
}

interface WithInitTracker {
  getInitSteps(): string[];
}

const InitTracker = createConstructorDecorator<Application & WithInitTracker, TrackerConfig>(
  function(config) {
    if (config?.trackInit) {
      const initSteps: string[] = [];
      
      // Type-safe: `this` knows about Application properties
      this.getInitSteps = () => initSteps;
      
      // Track initialization steps
      const originalOnInit = this.onInit?.bind(this);
      if (originalOnInit) {
        this.onInit = async function(...args: any[]) {
          initSteps.push('onInit started');
          await originalOnInit(...args);
          initSteps.push('onInit completed');
        };
      }
    }
  }
);

@InitTracker({ trackInit: true, trackDispose: false })
@Assemblage({
  inject: [[DatabaseService]],
  use: [['config', { host: 'localhost' }]],
})
class Application implements AbstractAssemblage {
  // Merge with extended interface for type safety
  getInitSteps?: () => string[];
  
  constructor(
    private db: DatabaseService,
    @Use('config') private config: any,
    @Context() private context: AssemblerContext
  ) {
    // All parameter decorators work normally
  }
  
  async onInit() {
    await this.db.connect();
  }
}

const app = Assembler.build(Application);
// Type-safe method call
console.log(app.getInitSteps?.()); // ['onInit started', 'onInit completed']
```

## Type Signature

```typescript
function createConstructorDecorator<
  TInstance = any,        // Type of your class instance
  TDefinition = object    // Type of your config object
>(
  callback?: (this: TInstance, definition?: TDefinition) => void
): (definition?: TDefinition) => ClassDecorator
```

**Generic Parameters:**
- `TInstance` - The type of your class instance (what `this` will be)
- `TDefinition` - The type of your configuration object

**Returns:** A decorator factory function that accepts optional configuration

## Decorator Placement

Decorators can be placed **above** or **below** `@Assemblage`:

```typescript
// Above @Assemblage
@Logger({ prefix: 'APP' })
@Assemblage()
class MyService implements AbstractAssemblage {}

// Below @Assemblage
@Assemblage()
@Logger({ prefix: 'APP' })
class MyService implements AbstractAssemblage {}
```

Both placements work identically.

## Multiple Decorators

Stack multiple decorators together:

```typescript
const Loggable = createConstructorDecorator<MyService, { prefix: string }>(
  function(config) {
    this.logPrefix = config?.prefix || 'DEFAULT';
  }
);

const Traceable = createConstructorDecorator<MyService, { trackCalls: boolean }>(
  function(config) {
    if (config?.trackCalls) {
      this.callCount = 0;
    }
  }
);

@Traceable({ trackCalls: true })
@Loggable({ prefix: 'APP' })
@Assemblage()
class MyService implements AbstractAssemblage {
  logPrefix?: string;
  callCount?: number;
}
```

## Type Safety with Intersection Types

Use intersection types to extend class types:

```typescript
interface WithLogging {
  log(message: string): void;
}

const AddLogging = createConstructorDecorator<MyService & WithLogging, void>(
  function() {
    // `this` is typed as MyService & WithLogging
    this.log = (message: string) => {
      console.log(`[${this.constructor.name}] ${message}`);
    };
  }
);

@AddLogging()
@Assemblage()
class MyService implements AbstractAssemblage {
  log?: (message: string) => void; // Add optional property
  
  doSomething() {
    this.log?.('Doing something'); // Type-safe call
  }
}
```

## Wrapping Lifecycle Hooks

Decorators can wrap lifecycle hooks:

```typescript
interface PerformanceConfig {
  trackPerformance: boolean;
}

const PerformanceTracker = createConstructorDecorator<App, PerformanceConfig>(
  function(config) {
    if (!config?.trackPerformance) return;
    
    // Wrap onInit
    const originalOnInit = this.onInit?.bind(this);
    if (originalOnInit) {
      this.onInit = async function(...args: any[]) {
        const start = performance.now();
        await originalOnInit(...args);
        const duration = performance.now() - start;
        console.log(`onInit took ${duration}ms`);
      };
    }
    
    // Wrap onDispose
    const originalOnDispose = this.onDispose?.bind(this);
    if (originalOnDispose) {
      this.onDispose = async function(...args: any[]) {
        const start = performance.now();
        await originalOnDispose(...args);
        const duration = performance.now() - start;
        console.log(`onDispose took ${duration}ms`);
      };
    }
  }
);
```

## Accessing Dependencies

Decorators execute **after** the constructor, so all dependencies are available:

```typescript
const ValidateDatabase = createConstructorDecorator<DatabaseService, void>(
  function() {
    // `this.connection` is already injected
    if (!this.connection) {
      throw new Error('Database connection not injected');
    }
    
    console.log('Database validated');
  }
);

@ValidateDatabase()
@Assemblage({ inject: [[DatabaseConnection]] })
class DatabaseService implements AbstractAssemblage {
  constructor(private connection: DatabaseConnection) {}
}
```

## Important Notes

1. **Always use `function`** (not arrow function) to access `this`
2. The decorator function runs **after** the constructor
3. All parameter decorators (`@Use`, `@Context`, etc.) are preserved
4. Can be combined with multiple decorators
5. Add properties to your class for full type safety
6. Use intersection types (`MyClass & WithExtension`) for extending class types

## Exported Types

```typescript
// Type for the callback function
type ConstructorDecoratorCallback<TInstance, TDefinition> = 
  (this: TInstance, definition?: TDefinition) => void;

// Type for the decorator function itself
type ConstructorDecoratorFunction<TDefinition> = 
  (definition?: TDefinition) => ClassDecorator;
```

## Real-World Example: Validation

```typescript
interface ValidationConfig {
  strict: boolean;
  rules: string[];
}

interface WithValidation {
  validate(): boolean;
  validationErrors: string[];
}

const Validatable = createConstructorDecorator<User & WithValidation, ValidationConfig>(
  function(config) {
    this.validationErrors = [];
    
    this.validate = () => {
      this.validationErrors = [];
      
      if (config?.rules.includes('email') && !this.email.includes('@')) {
        this.validationErrors.push('Invalid email');
      }
      
      if (config?.rules.includes('age') && this.age < 0) {
        this.validationErrors.push('Invalid age');
      }
      
      if (config?.strict && this.validationErrors.length > 0) {
        throw new Error('Validation failed: ' + this.validationErrors.join(', '));
      }
      
      return this.validationErrors.length === 0;
    };
  }
);

@Validatable({ strict: true, rules: ['email', 'age'] })
@Assemblage()
class User implements AbstractAssemblage {
  validate?: () => boolean;
  validationErrors?: string[];
  
  constructor(
    public email: string,
    public age: number
  ) {}
}

const user = Assembler.build(User, { email: 'test@example.com', age: 25 });
console.log(user.validate()); // true
```

## Next Steps

- [Parameter Decorators](./parameter-decorators.md) - Built-in parameter decorators
- [Custom Parameter Decorators](./custom-parameter.md) - Create parameter decorators
- [Advanced Examples](../guides/advanced-examples.md) - See decorators in action
- [Types API](../api/types.md) - Exported types reference
