# Quick Start

Learn how to build your first application with `assemblerjs` in under 5 minutes.

## Step 1: Setup

Make sure you have [installed assemblerjs](./installation.md) and imported `reflect-metadata`:

```typescript
import 'reflect-metadata';
```

## Step 2: Define a Service

Create a simple logger service:

```typescript
import { Assemblage, AbstractAssemblage } from 'assemblerjs';

@Assemblage()
class Logger implements AbstractAssemblage {
  log(message: string) {
    console.log(message);
  }
}
```

## Step 3: Create Your Application

Define an application that depends on the logger:

```typescript
@Assemblage({
  inject: [[Logger]], // Declare dependencies
})
class App implements AbstractAssemblage {
  constructor(private logger: Logger) {}

  start() {
    this.logger.log('App started!');
  }
}
```

## Step 4: Bootstrap

Build and run your application:

```typescript
import { Assembler } from 'assemblerjs';

const app = Assembler.build(App);
app.start(); // Output: "App started!"
```

## Complete Example

```typescript
import 'reflect-metadata';
import { Assemblage, Assembler, AbstractAssemblage } from 'assemblerjs';

// Define a service
@Assemblage()
class Logger implements AbstractAssemblage {
  log(message: string) {
    console.log(message);
  }
}

// Define an application that depends on Logger
@Assemblage({
  inject: [[Logger]], // Declare dependencies
})
class App implements AbstractAssemblage {
  constructor(private logger: Logger) {}

  start() {
    this.logger.log('App started!');
  }
}

// Bootstrap the application
const app = Assembler.build(App);
app.start(); // Output: "App started!"
```

## Next Steps

- [Assemblage Concept](../core-concepts/assemblage.md) - Understand the building blocks
- [Dependency Injection](../core-concepts/dependency-injection.md) - Learn advanced DI patterns
- [Lifecycle Hooks](../core-concepts/lifecycle-hooks.md) - Control initialization and cleanup
