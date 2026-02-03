# assembler.js Documentation

Welcome to the official documentation for **assembler.js** - a modern, type-safe, and lightweight Dependency Injection library for **Node.js AND Browsers** 🌐.

## What is assembler.js?

`assembler.js` is a powerful DI container that helps you build maintainable, testable, and scalable applications with TypeScript. It provides:

- 🎯 **Minimal Dependencies** - Only requires `reflect-metadata`
- 🔒 **Type-Safe** - Full TypeScript support with generics
- 🌳 **Tree-Shakable** - Optimized bundle size (~5-6 KB for minimal usage)
- ♻️ **Lifecycle Hooks** - `onRegister`, `onInit`, `onDispose`
- 📡 **Built-in Event System** - Integrated EventManager
- 🎨 **Custom Decorators** - Easy creation with factories
- 🏷️ **Tags Support** - Group and retrieve dependencies
- 🔀 **AOP/Transversals** - Aspect-Oriented Programming with cross-cutting concerns
- 🌐 **Universal** - **Works seamlessly in Node.js AND Browsers** - No platform-specific code
- 📦 **Browser-Friendly** - Small bundle size, perfect for frontend applications

## Quick Example

```typescript
import 'reflect-metadata';
import { Assemblage, Assembler, AbstractAssemblage } from 'assemblerjs';

@Assemblage()
class Logger implements AbstractAssemblage {
  log(message: string) {
    console.log(message);
  }
}

@Assemblage({ inject: [[Logger]] })
class App implements AbstractAssemblage {
  constructor(private logger: Logger) {}

  start() {
    this.logger.log('App started!');
  }
}

const app = Assembler.build(App);
app.start();
```

## Documentation Structure

### [🚀 Getting Started](./getting-started/installation.md)

Learn the basics and get your first application running:
- [Installation](./getting-started/installation.md)
- [Quick Start Guide](./getting-started/quick-start.md)
- [TypeScript Setup](./getting-started/typescript-setup.md)

### [📖 Core Concepts](./core-concepts/assemblage.md)

Understand the fundamental concepts:
- [Assemblage](./core-concepts/assemblage.md) - Building blocks of the DI container
- [Dependency Injection](./core-concepts/dependency-injection.md) - Injection patterns
- [Abstraction Pattern](./core-concepts/abstraction-pattern.md) - Interface-based design
- [Lifecycle Hooks](./core-concepts/lifecycle-hooks.md) - Initialization & cleanup
- [Transversals (AOP)](./core-concepts/transversals-aop.md) - Aspect-Oriented Programming and cross-cutting concerns

### [🎨 Decorators](./decorators/parameter-decorators.md)

Master the decorator system:
- [Parameter Decorators](./decorators/parameter-decorators.md) - Built-in decorators (`@Context()`, `@Configuration()`, etc.)
- [Custom Parameter Decorators](./decorators/custom-parameter.md) - Create your own parameter decorators
- [Custom Class Decorators](./decorators/custom-class.md) - Type-safe class decorators
- [AOP Decorators](./decorators/aop-decorators.md) - `@Transversal()`, `@Before()`, `@After()`, `@Around()`, `@Affect()`

### [✨ Features](./features/events.md)

Explore advanced features:
- [Event System](./features/events.md) - Event-driven architecture with EventManager
- [Tags](./features/tags.md) - Group and retrieve assemblages by category
- [Singleton vs Transient](./features/singleton-transient.md) - Control instance lifecycle
- [Debug Logging](./guides/debug-logging.md) - Built-in debug logging system with cycle detection

### [📚 API Reference](./api/assembler.md)
Complete API documentation:
- [Assembler API](./api/assembler.md) - Container bootstrap methods
- [AssemblerContext API](./api/context.md) - Context interface for dependency management
- [TransversalWeaver API](./api/transversal-weaver.md) - Caller tracking and context management
- [Types](./api/types.md) - TypeScript types and interfaces

### [📘 Guides](./guides/advanced-examples.md)

Real-world examples and optimization:
- [Advanced Examples](./guides/advanced-examples.md) - Multi-module apps, plugin systems, factories
- [Caller Tracking](./guides/caller-tracking.md) - Audit logging, authorization, and request tracing with transversals
- [Tree-Shaking Guide](./guides/tree-shaking.md) - Bundle optimization strategies
## Installation

```sh
npm install assemblerjs reflect-metadata
```

```sh
yarn add assemblerjs reflect-metadata
```

**Important:** Import `reflect-metadata` at your application entry point:

```typescript
import 'reflect-metadata';
```

## 🎯 New: Caller Tracking in Transversals

Track which service or component initiated method calls for audit logging, authorization, and request tracing!

**Quick Example:**

```typescript
@Transversal()
class AuditTransversal {
  @Before('execution(*.*)')
  audit(context: AdviceContext) {
    console.log(`${context.caller} called ${context.methodName}`);
  }
}

// In Vue or external code
await TransversalWeaver.withCaller('UserEditComponent', async () => {
  await userService.save(data);
  // Logs: "UserEditComponent called save"
});
```

📖 **Learn more:** [Caller Tracking Quick Start](../CALLER_TRACKING_QUICK_START.md) | [Complete Guide](./guides/caller-tracking.md) | [API Reference](./api/transversal-weaver.md)

## Requirements

- **Node.js:** ≥ 18.12.0
- **TypeScript:** ≥ 5.0 (with decorator support)
- **reflect-metadata:** Required for dependency injection

## Why assembler.js?

### Inspired by the Best

`assembler.js` combines ideas from leading DI frameworks:
- **DIOD** - Lightweight and modular approach
- **NestJS** - Powerful decorator system and lifecycle management

### Key Advantages

1. **Small Bundle Size** - Tree-shakable design keeps your bundles minimal
2. **Type Safety** - Full TypeScript support with generics
3. **Flexibility** - Support for both concrete and abstract dependencies
4. **Events** - Built-in event system for decoupled communication
5. **Extensibility** - Easy creation of custom decorators
6. **Testing** - Abstraction pattern makes testing a breeze

## Community & Support

- 📦 **NPM Package:** [assemblerjs](https://www.npmjs.com/package/assemblerjs)
- 🐛 **Issue Tracker:** [GitHub Issues](https://github.com/benoitlahoz/assemblerjs/issues)

## License

MIT © Benoît Lahoz

---

**Made with ❤️ in Marseille**
