# Types API

Reference for exported TypeScript types and interfaces in `assemblerjs`.

## Core Types

### AbstractAssemblage

Interface that marks classes as injectable assemblages.

```typescript
interface AbstractAssemblage {
  onInit?(context: AssemblerContext, configuration: Record<string, any>): void | Promise<void>;
  onDispose?(context: AssemblerContext, configuration: Record<string, any>): void | Promise<void>;
}
```

**Usage:**

```typescript
@Assemblage()
class MyService implements AbstractAssemblage {
  onInit() {
    // Optional initialization
  }
  
  onDispose() {
    // Optional cleanup
  }
}
```

### AbstractTransversal

Interface for transversal (aspect) classes that provide cross-cutting concerns.

```typescript
interface AbstractTransversal {
  onInit?(context: AssemblerContext, configuration: Record<string, any>): void | Promise<void>;
  onDispose?(context: AssemblerContext, configuration: Record<string, any>): void | Promise<void>;
  static onRegister?(context: AssemblerContext, configuration?: Record<string, any>): void;
}
```

**Usage:**

```typescript
@Transversal()
class LoggingTransversal implements AbstractTransversal {
  onInit() {
    console.log('Transversal initialized');
  }

  @Before('execution(*.*)')
  logMethodCall(context: AdviceContext) {
    console.log('Method called:', context.methodName);
  }
}
```

### AssemblageDefinition

Configuration interface for the `@Assemblage` decorator.

```typescript
interface AssemblageDefinition {
  singleton?: boolean;           // Default: true
  inject?: InjectDefinition[];   // Dependencies
  use?: UseDefinition[];         // Objects to register
  engage?: TransversalInjection[]; // Transversals to apply
  tags?: string[];               // Tags for grouping
  events?: string[];             // Event channels
  metadata?: Record<string, any>; // Custom metadata
  global?: Record<string, any>;  // Global values
}
```

**Usage:**

```typescript
@Assemblage({
  singleton: true,
  inject: [[DatabaseService]],
  engage: [[LoggingTransversal], [SecurityTransversal]],
  tags: ['service'],
  metadata: { version: '1.0' },
})
class MyService implements AbstractAssemblage {}
```

### InjectDefinition

Type for dependency injection definitions.

```typescript
type InjectDefinition =
  | [Identifier]                                    // Simple injection
  | [Identifier, Identifier]                        // Interface binding
  | [Identifier, Record<string, any>]               // With configuration
  | [Identifier, Identifier, Record<string, any>];  // Interface + config
```

**Examples:**

```typescript
// Simple injection
[DatabaseService]

// Interface binding
[AbstractLogger, ConsoleLogger]

// With configuration
[DatabaseService, { host: 'localhost' }]

// Interface binding + configuration
[AbstractLogger, ConsoleLogger, { level: 'debug' }]
```

### TransversalInjection

Type for transversal (aspect) injection definitions.

```typescript
type TransversalInjection<T = any> =
  | [Identifier<T>]                                  // Simple transversal
  | [Identifier<T>, Record<string, any>]             // Transversal with config
  | [Identifier<T>, Identifier<T>]                   // Abstract binding
  | [Identifier<T>, Identifier<T>, Record<string, any>]; // Abstract + config
```

**Examples:**

```typescript
// Simple transversal injection
[LoggingTransversal]

// With configuration
[PerformanceTransversal, { threshold: 100 }]

// Abstract binding
[AbstractLoggingTransversal, ConsoleLoggingTransversal]

// Abstract binding + configuration
[AbstractLoggingTransversal, ConsoleLoggingTransversal, { level: 'debug' }]
```

**Usage in engage:**

```typescript
@Assemblage({
  inject: [[UserService]],
  engage: [
    [LoggingTransversal],
    [SecurityTransversal, { requireAuth: true }]
  ]
})
class App implements AbstractAssemblage {}

### UseDefinition

Type for object registration with `use`.

```typescript
type UseDefinition = [string, any];
```

**Example:**

```typescript
@Assemblage({
  use: [
    ['apiClient', new ApiClient()],
    ['config', { host: 'localhost' }],
  ],
})
class MyService implements AbstractAssemblage {}
```

## Decorator Types

### ConstructorDecoratorCallback

Type for custom class decorator callback functions.

```typescript
type ConstructorDecoratorCallback<TInstance, TDefinition> = 
  (this: TInstance, definition?: TDefinition) => void;
```

**Usage:**

```typescript
const MyDecorator = createConstructorDecorator<MyClass, MyConfig>(
  function(config) {
    // `this` is typed as MyClass
    // `config` is typed as MyConfig | undefined
  }
);
```

### ConstructorDecoratorFunction

Type for the decorator function itself.

```typescript
type ConstructorDecoratorFunction<TDefinition> = 
  (definition?: TDefinition) => ClassDecorator;
```

### DecoratorFactory

Type for decorator factory return value.

```typescript
type DecoratorFactory<TDefinition> = 
  ConstructorDecoratorFunction<TDefinition>;
```

## Identifier Types

### Identifier

Type for dependency identifiers.

```typescript
type Identifier<T = any> = Function | string | symbol;
```

**Examples:**

```typescript
// Class identifier
const id: Identifier = DatabaseService;

// String identifier
const id: Identifier = 'apiClient';

// Symbol identifier
const id: Identifier = Symbol('service');
```

## Context Types

### AssemblerContext

Interface for the DI container context.

```typescript
interface AssemblerContext {
  has(identifier: Identifier): boolean;
  require<T>(identifier: Identifier<T>): T;
  tagged(...tags: string[]): any[];
  global<T = any>(identifier: string): T;
  global<T = any>(identifier: string, value: T): void;
  on(channel: string, callback: Listener): AssemblerContext;
  once(channel: string, callback: Listener): AssemblerContext;
  off(channel: string, callback?: Listener): AssemblerContext;
  identifiers: Identifier[];
  entryAssemblage: any;
}
```

See [AssemblerContext API](./context.md) for method details.

### Listener

Type for event listeners.

```typescript
type Listener = (...args: any[]) => void | Promise<void>;
```

**Example:**

```typescript
const listener: Listener = (data) => {
  console.log('Event:', data);
};

context.on('event', listener);
```

## AOP (Transversal) Types

### AdviceType

Type for advice execution timing.

```typescript
type AdviceType = 'before' | 'after' | 'around';
```

**Usage:**

```typescript
const type: AdviceType = 'before';
```

### JoinPoint

Information about the point of execution where an advice is applied.

```typescript
interface JoinPoint {
  target: any;           // The target instance
  methodName: string;    // The name of the method being called
  args: any[];          // The arguments passed to the method
  result?: any;         // The result of the method (for after advice)
  error?: any;          // The error thrown by the method (if any)
}
```

**Usage:**

```typescript
function logJoinPoint(joinPoint: JoinPoint) {
  console.log('Method:', joinPoint.methodName);
  console.log('Args:', joinPoint.args);
  console.log('Result:', joinPoint.result);
}
```

### AdviceContext

Extended join point with control flow for advices.

```typescript
interface AdviceContext extends JoinPoint {
  proceed?(): any | Promise<any>;  // Continue to next advice or original method
  config?: Record<string, any>;    // Optional config from @Affect decorator
}
```

**Usage:**

```typescript
@Transversal()
class MyTransversal {
  @Around('execution(*.*)')
  async intercept(context: AdviceContext) {
    console.log('Before:', context.methodName);
    
    // Call next advice or original method
    const result = await context.proceed!();
    
    console.log('After:', result);
    return result;
  }
}
```

### Advice

Definition of a single advice to be applied.

```typescript
interface Advice {
  type: AdviceType;                  // 'before' | 'after' | 'around'
  pointcut: string;                  // Pointcut expression
  method: Function;                  // The advice method to execute
  transversalInstance: any;          // The transversal instance that owns this advice
  priority: number;                  // Execution priority (higher first)
  enabled: boolean;                  // Whether this advice is enabled
  role?: string;                     // Optional role identifier
  config?: Record<string, any>;      // Optional config from @Affect
}
```

**Usage:**

```typescript
const advice: Advice = {
  type: 'before',
  pointcut: 'execution(UserService.*)',
  method: myTransversal.logBefore,
  transversalInstance: myTransversal,
  priority: 100,
  enabled: true
};
```

### TransversalMetadata

Metadata about a registered transversal.

```typescript
interface TransversalMetadata {
  definition: any;      // The assemblage definition
  advices: Advice[];    // The advices defined in this transversal
  instance?: any;       // The transversal instance
}
```

### AffectedMethodConfig

Configuration for explicit transversal application via @Affect.

```typescript
interface AffectedMethodConfig {
  transversal: Identifier<any>;      // The transversal class to apply
  role?: string;                     // Optional role filter
  config?: Record<string, any>;      // Optional configuration
}
```

**Usage:**

```typescript
// Applied by @Affect decorator
@Affect(LoggingTransversal, { level: 'debug' })
methodName() { }

// Equivalent configuration:
const config: AffectedMethodConfig = {
  transversal: LoggingTransversal,
  config: { level: 'debug' }
};
```

## Parameter Decorator Types

### ParameterResolver

Interface for custom parameter decorator resolvers.

```typescript
interface ParameterResolver {
  resolve(value: any, context: AssemblerContext): any | Promise<any>;
}
```

**Usage:**

```typescript
class MyResolver implements ParameterResolver {
  resolve(value: string, context: AssemblerContext): MyService {
    return new MyService(value);
  }
}
```

### ParameterDecoratorOptions

Configuration for `ParameterDecoratorFactory.create()`.

```typescript
interface ParameterDecoratorOptions<T> {
  name: string;                    // Unique name
  valueType: 'single' | 'array' | 'map'; // How values are stored
  resolver: ParameterResolver;     // Resolver class
}
```

**Usage:**

```typescript
const MyDecorator = ParameterDecoratorFactory.create<string>({
  name: 'MyDecorator',
  valueType: 'single',
  resolver: MyResolver,
});
```

## Event Types

### EventManager

Base class for event emitting assemblages.

```typescript
class EventManager {
  addChannels(...channels: string[]): EventManager;
  removeChannels(...channels: string[]): EventManager;
  on(channel: string, callback: Listener): EventManager;
  once(channel: string, callback: Listener): EventManager;
  off(channel: string, callback?: Listener): EventManager;
  emit(channel: string, ...args: any[]): EventManager;
  dispose(): void;
}
```

**Usage:**

```typescript
@Assemblage({ events: ['app:event'] })
class MyService 
  extends EventManager 
  implements AbstractAssemblage 
{
  constructor() {
    super('app:event');
  }
}
```

## Type Guards

### Type-safe require

Use generics for type-safe dependency resolution:

```typescript
// Type-safe
const service = context.require<DatabaseService>(DatabaseService);
// service is typed as DatabaseService

// Less specific
const service2 = context.require(DatabaseService);
// service2 is typed as any
```

### Type-safe global

Use generics for type-safe global values:

```typescript
// Type-safe
const apiKey = context.global<string>('apiKey');
// apiKey is typed as string

// Less specific
const value = context.global('apiKey');
// value is typed as any
```

## Utility Types

### Partial Configuration

Make configuration properties optional:

```typescript
interface MyConfig {
  host: string;
  port: number;
  ssl: boolean;
}

type PartialConfig = Partial<MyConfig>;

@Assemblage()
class MyService implements AbstractAssemblage {
  constructor(@Configuration() config: PartialConfig) {
    // All properties are optional
  }
}
```

### Required Configuration

Ensure all properties are present:

```typescript
type RequiredConfig = Required<MyConfig>;

@Assemblage()
class MyService implements AbstractAssemblage {
  constructor(@Configuration() config: RequiredConfig) {
    // All properties are required
  }
}
```

## Import Statements

```typescript
// Core types
import { 
  AbstractAssemblage,
  AbstractTransversal,
  AssemblageDefinition,
  InjectDefinition,
  TransversalInjection,
  UseDefinition,
} from 'assemblerjs';

// Context types
import { 
  AssemblerContext,
  Identifier,
  Listener,
} from 'assemblerjs';

// AOP types
import {
  AdviceType,
  JoinPoint,
  AdviceContext,
  Advice,
  TransversalMetadata,
  AffectedMethodConfig,
} from 'assemblerjs';

// Decorator types
import {
  ConstructorDecoratorCallback,
  ConstructorDecoratorFunction,
  DecoratorFactory,
} from 'assemblerjs';

// Parameter decorator types
import {
  ParameterResolver,
  ParameterDecoratorOptions,
} from 'assemblerjs';

// Event types
import { EventManager } from 'assemblerjs';

// Debug types
import { AssemblerDebugOptions } from 'assemblerjs';
```

## Debug Types

### AssemblerDebugOptions

Configuration interface for the debug logging system.

```typescript
interface AssemblerDebugOptions {
  enabled?: boolean;
  logger?: (level: 'info' | 'warn' | 'error', message: string, data?: any) => void;
  logPhases?: {
    registration?: boolean;
    resolution?: boolean;
    construction?: boolean;
    hooks?: boolean;
    cache?: boolean;
  };
  logTimings?: boolean;
  logDependencyTree?: boolean;
  useColors?: boolean;
}
```

**Properties:**

- `enabled` - Enable/disable debug logging (default: `true`)
- `logger` - Custom logging function (default: uses `console.log`)
- `logPhases` - Filter which build phases to log (default: all `true`)
- `logTimings` - Include execution time for operations (default: `false`)
- `logDependencyTree` - Log dependency tree visualization (default: `true`)
- `useColors` - Use ANSI color codes in output (default: `true`)

**Usage:**

```typescript
Assembler.enableDebug({
  logTimings: true,
  useColors: false,
  logPhases: {
    registration: true,
    hooks: true,
  },
});
```

See [Debug Logging](../features/debug-logging.md) for complete documentation.

## Next Steps

- [Assembler API](./assembler.md) - Container methods
- [AssemblerContext API](./context.md) - Context interface
- [Transversals (AOP)](../core-concepts/transversals-aop.md) - Aspect-oriented programming
- [AOP Decorators](../decorators/aop-decorators.md) - @Transversal, @Before, @After, @Around, @Affect
- [Custom Class Decorators](../decorators/custom-class.md) - Use decorator types
- [Custom Parameter Decorators](../decorators/custom-parameter.md) - Create resolvers
