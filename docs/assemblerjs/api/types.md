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

### AssemblageDefinition

Configuration interface for the `@Assemblage` decorator.

```typescript
interface AssemblageDefinition {
  singleton?: boolean;           // Default: true
  inject?: InjectDefinition[];   // Dependencies
  use?: UseDefinition[];         // Objects to register
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
  AssemblageDefinition,
  InjectDefinition,
  UseDefinition,
} from 'assemblerjs';

// Context types
import { 
  AssemblerContext,
  Identifier,
  Listener,
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
```

## Next Steps

- [Assembler API](./assembler.md) - Container methods
- [AssemblerContext API](./context.md) - Context interface
- [Custom Class Decorators](../decorators/custom-class.md) - Use decorator types
- [Custom Parameter Decorators](../decorators/custom-parameter.md) - Create resolvers
