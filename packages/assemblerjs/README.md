# assembler.js

A modern, type-safe, and lightweight [Dependency Injection](https://en.wikipedia.org/wiki/Dependency_injection) library for Node.js and browsers.

![Statements](https://img.shields.io/badge/statements-91.01%25-brightgreen.svg?style=flat) ![Branches](https://img.shields.io/badge/branches-79.6%25-red.svg?style=flat) ![Functions](https://img.shields.io/badge/functions-87.62%25-yellow.svg?style=flat) ![Lines](https://img.shields.io/badge/lines-90.76%25-brightgreen.svg?style=flat)

---

## Features

- 🎯 **Minimal Dependencies** - Only requires `reflect-metadata`
- 🔒 **Type-Safe** - Full TypeScript support with generics
- 🌳 **Tree-Shakable** - Optimized bundle size (~5-6 KB for minimal usage)
- ♻️ **Lifecycle Hooks** - `onRegister`, `onInit`, `onDispose`
- 📡 **Built-in Event System** - Integrated EventManager
- 🎨 **Custom Decorators** - Easy creation with `ParameterDecoratorFactory` and `createConstructorDecorator`
- 🔧 **Flexible Configuration** - Runtime configuration override
- 🏷️ **Tags Support** - Group and retrieve dependencies by tags
- 🌐 **Universal** - Works in Node.js and browsers
- 🔄 **Singleton & Transient** - Control instance lifecycle

Inspired by [DIOD](https://github.com/artberri/diod) and [NestJS](https://nestjs.com/).

## Installation

```sh
npm install assemblerjs reflect-metadata
```

```sh
yarn add assemblerjs reflect-metadata
```

**Important:** You must import `reflect-metadata` at the entry point of your application:

```typescript
import 'reflect-metadata';
```

## Quick Start

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

## 📚 Documentation

Comprehensive documentation is available at:

**[→ Full Documentation](../../docs/assemblerjs/)**

### Quick Links

#### Getting Started
- [Installation](../../docs/assemblerjs/getting-started/installation.md)
- [Quick Start Guide](../../docs/assemblerjs/getting-started/quick-start.md)
- [TypeScript Setup](../../docs/assemblerjs/getting-started/typescript-setup.md)

#### Core Concepts
- [Assemblage](../../docs/assemblerjs/core-concepts/assemblage.md) - Building blocks
- [Dependency Injection](../../docs/assemblerjs/core-concepts/dependency-injection.md) - DI patterns
- [Abstraction Pattern](../../docs/assemblerjs/core-concepts/abstraction-pattern.md) - Interface-based design
- [Lifecycle Hooks](../../docs/assemblerjs/core-concepts/lifecycle-hooks.md) - Initialization & cleanup

#### Decorators
- [Parameter Decorators](../../docs/assemblerjs/decorators/parameter-decorators.md) - Built-in decorators
- [Custom Parameter Decorators](../../docs/assemblerjs/decorators/custom-parameter.md) - Create your own
- [Custom Class Decorators](../../docs/assemblerjs/decorators/custom-class.md) - Type-safe class decorators

#### Features
- [Event System](../../docs/assemblerjs/features/events.md) - Event-driven architecture
- [Tags](../../docs/assemblerjs/features/tags.md) - Group assemblages
- [Singleton vs Transient](../../docs/assemblerjs/features/singleton-transient.md) - Instance lifecycle

#### API Reference
- [Assembler API](../../docs/assemblerjs/api/assembler.md) - Container methods
- [AssemblerContext API](../../docs/assemblerjs/api/context.md) - Context interface
- [Types](../../docs/assemblerjs/api/types.md) - TypeScript types

#### Guides
- [Advanced Examples](../../docs/assemblerjs/guides/advanced-examples.md) - Real-world patterns
- [Tree-Shaking](../../docs/assemblerjs/guides/tree-shaking.md) - Bundle optimization

## Requirements

- **Node.js:** ≥ 18.12.0
- **TypeScript:** ≥ 5.0 (with decorator support)
- **reflect-metadata:** Required for dependency injection

## For Contributors

### Architecture

This package is part of the `assemblerjs` monorepo and depends on:

- **`@assemblerjs/core`** - Internal utilities package

### Development

```bash
# Install dependencies from workspace root
yarn install

# Build the package
npx nx build assemblerjs

# Run tests
npx nx test assemblerjs
```

## Tree-Shaking & Bundle Optimization

`assembler.js` is optimized for tree-shaking with modular exports. Import only what you need:

```typescript
// ❌ Large bundle (imports everything)
import * as Assembler from 'assemblerjs';

// ✅ Optimal (only imports required modules)
import { Assemblage, Assembler, AbstractAssemblage } from 'assemblerjs';
```

### Bundle Size Examples

- **Minimal usage** (~5-6 KB): Core DI features only
- **Medium usage** (~15-18 KB): DI + Events + Parameter decorators
- **Full library** (~35 KB): All features

The package uses:
- ✅ `"sideEffects": false` - Safe to remove unused modules
- ✅ Modular exports - Each feature in separate files
- ✅ ESM format - Native tree-shaking support

## TypeScript Configuration

Enable decorators and reflection in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"]
  }
}
```

## Requirements

- **Node.js:** ≥ 18.12.0
- **TypeScript:** ≥ 5.0 (with decorator support)
- **reflect-metadata:** Required for dependency injection

## For Contributors

### Architecture

This package is part of the `assemblerjs` monorepo and depends on:

- **`@assemblerjs/core`** - Internal utilities package providing:
  - Type utilities and helpers
  - Collection management utilities
  - Error handling utilities
  - Conditional utilities
  - Array manipulation helpers

This dependency is automatically installed with `assemblerjs` and transparent to end users.

### Development

```bash
# Install dependencies from workspace root
yarn install

# Build the package
npx nx build assemblerjs

# Run tests
npx nx test assemblerjs
```

### Monorepo Structure

```
assemblerjs/
├── packages/
│   ├── assemblerjs/       # Main DI library (this package)
│   ├── core/              # Internal utilities
│   ├── dto/               # DTO utilities
│   ├── electron/          # Electron integration
│   ├── fetch/             # Fetch utilities
│   ├── mongo/             # MongoDB integration
│   └── rest/              # REST utilities
```

## License

MIT

---

**Made with ❤️ in Marseille**
