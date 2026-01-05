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

### [🚀 Getting Started](./assemblerjs/getting-started/installation.md)

Learn the basics and get your first application running:
- [Installation](./assemblerjs/getting-started/installation.md)
- [Quick Start Guide](./assemblerjs/getting-started/quick-start.md)
- [TypeScript Setup](./assemblerjs/getting-started/typescript-setup.md)

### [📖 Core Concepts](./assemblerjs/core-concepts/assemblage.md)

Understand the fundamental concepts:
- [Assemblage](./assemblerjs/core-concepts/assemblage.md) - Building blocks of the DI container
- [Dependency Injection](./assemblerjs/core-concepts/dependency-injection.md) - Injection patterns
- [Abstraction Pattern](./assemblerjs/core-concepts/abstraction-pattern.md) - Interface-based design
- [Lifecycle Hooks](./assemblerjs/core-concepts/lifecycle-hooks.md) - Initialization & cleanup

### [🎨 Decorators](./assemblerjs/decorators/parameter-decorators.md)

Master the decorator system:
- [Parameter Decorators](./assemblerjs/decorators/parameter-decorators.md) - Built-in decorators (`@Context()`, `@Configuration()`, etc.)
- [Custom Parameter Decorators](./assemblerjs/decorators/custom-parameter.md) - Create your own parameter decorators
- [Custom Class Decorators](./assemblerjs/decorators/custom-class.md) - Type-safe class decorators

### [✨ Features](./assemblerjs/features/events.md)

Explore advanced features:
- [Event System](./assemblerjs/features/events.md) - Event-driven architecture with EventManager
- [Tags](./assemblerjs/features/tags.md) - Group and retrieve assemblages by category
- [Singleton vs Transient](./assemblerjs/features/singleton-transient.md) - Control instance lifecycle

### [📚 API Reference](./assemblerjs/api/assembler.md)

Complete API documentation:
- [Assembler API](./assemblerjs/api/assembler.md) - Container bootstrap methods
- [AssemblerContext API](./assemblerjs/api/context.md) - Context interface for dependency management
- [Types](./assemblerjs/api/types.md) - TypeScript types and interfaces

### [📘 Guides](./assemblerjs/guides/advanced-examples.md)

Real-world examples and optimization:
- [Advanced Examples](./assemblerjs/guides/advanced-examples.md) - Multi-module apps, plugin systems, factories
- [Tree-Shaking Guide](./assemblerjs/guides/tree-shaking.md) - Bundle optimization strategies

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
