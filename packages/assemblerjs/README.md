# assembler.js

A modern, type-safe, and lightweight [Dependency Injection](https://en.wikipedia.org/wiki/Dependency_injection) library for **Node.js and Browsers** 🌐.

> ✨ **Universal Library**: Works seamlessly in Node.js, browsers, and any JavaScript environment that supports ES2020+

![Statements](https://img.shields.io/badge/statements-93.78%25-brightgreen.svg?style=flat) ![Branches](https://img.shields.io/badge/branches-83.87%25-yellow.svg?style=flat) ![Functions](https://img.shields.io/badge/functions-93.63%25-brightgreen.svg?style=flat) ![Lines](https://img.shields.io/badge/lines-93.96%25-brightgreen.svg?style=flat)

## Performance Metrics

![assembler building](https://img.shields.io/badge/assembler%20building-11k%20ops%2Fsec-green.svg?style=flat)
![singleton cache](https://img.shields.io/badge/singleton%20cache-104k%20ops%2Fsec-brightgreen.svg?style=flat)
![event emit](https://img.shields.io/badge/event%20emit-539k%20ops%2Fsec-brightgreen.svg?style=flat)
![decorators](https://img.shields.io/badge/decorators-550k%20ops%2Fsec-brightgreen.svg?style=flat)

[→ Full Benchmarks](https://github.com/benoitlahoz/assemblerjs/blob/main/docs/assemblerjs/performance/benchmarks.md)

---

## Features

- 🎯 **Minimal Dependencies** - Only requires `reflect-metadata`
- 🔒 **Type-Safe** - Full TypeScript support with generics
- 🌳 **Tree-Shakable** - Optimized bundle size (~5-6 KB for minimal usage)
- ♻️ **Lifecycle Hooks** - `onRegister`, `onInit`, `onDispose`
- 📡 **Built-in Event System** - Integrated EventManager
- 🔀 **AOP/Transversals** - Cross-cutting concerns (logging, security, caching, performance)
- 🎨 **Custom Decorators** - Easy creation with `ParameterDecoratorFactory` and `createConstructorDecorator`
- 🔧 **Flexible Configuration** - Runtime configuration override
- 🏷️ **Tags Support** - Group and retrieve dependencies by tags
- 🌐 **Universal** - **Works in Node.js AND Browsers** - No platform-specific dependencies
- 🔄 **Singleton & Transient** - Control instance lifecycle
- 📦 **Small Bundle Size** - Perfect for frontend applications (~5-6 KB minified)

Inspired by [DIOD](https://github.com/artberri/diod) and [NestJS](https://nestjs.com/).

## Installation

Install `assemblerjs` and its peer dependency `reflect-metadata` using npm or yarn:

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

> ✨ **Works everywhere**: This installation works for **Node.js, browsers (with Vite/Webpack/Rollup), React, Vue, Angular, and any JavaScript environment**.

### Alternative: CDN (for quick prototyping)

If you want to try assemblerjs without a build step:

```html
<script src="https://unpkg.com/reflect-metadata@latest/Reflect.js"></script>
<script type="module">
  import { Assemblage, Assembler } from 'https://unpkg.com/assemblerjs@latest/dist/index.js';
  // Your code here
</script>
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

**[→ Full Documentation](https://github.com/benoitlahoz/assemblerjs/tree/main/docs/assemblerjs)**

### Quick Links

#### Getting Started
- [Installation](https://github.com/benoitlahoz/assemblerjs/blob/main/docs/assemblerjs/getting-started/installation.md)
- [Quick Start Guide](https://github.com/benoitlahoz/assemblerjs/blob/main/docs/assemblerjs/getting-started/quick-start.md)
- [TypeScript Setup](https://github.com/benoitlahoz/assemblerjs/blob/main/docs/assemblerjs/getting-started/typescript-setup.md)

#### Core Concepts
- [Assemblage](https://github.com/benoitlahoz/assemblerjs/blob/main/docs/assemblerjs/core-concepts/assemblage.md) - Building blocks
- [Dependency Injection](https://github.com/benoitlahoz/assemblerjs/blob/main/docs/assemblerjs/core-concepts/dependency-injection.md) - DI patterns
- [Abstraction Pattern](https://github.com/benoitlahoz/assemblerjs/blob/main/docs/assemblerjs/core-concepts/abstraction-pattern.md) - Interface-based design
- [Lifecycle Hooks](https://github.com/benoitlahoz/assemblerjs/blob/main/docs/assemblerjs/core-concepts/lifecycle-hooks.md) - Initialization & cleanup
- [Transversals (AOP)](https://github.com/benoitlahoz/assemblerjs/blob/main/docs/assemblerjs/core-concepts/transversals-aop.md) - Aspect-Oriented Programming

#### Decorators
- [Parameter Decorators](https://github.com/benoitlahoz/assemblerjs/blob/main/docs/assemblerjs/decorators/parameter-decorators.md) - Built-in decorators
- [Custom Parameter Decorators](https://github.com/benoitlahoz/assemblerjs/blob/main/docs/assemblerjs/decorators/custom-parameter.md) - Create your own
- [Custom Class Decorators](https://github.com/benoitlahoz/assemblerjs/blob/main/docs/assemblerjs/decorators/custom-class.md) - Type-safe class decorators
- [AOP Decorators](https://github.com/benoitlahoz/assemblerjs/blob/main/docs/assemblerjs/decorators/aop-decorators.md) - @Transversal, @Before, @After, @Around, @Affect

#### Features
- [Event System](https://github.com/benoitlahoz/assemblerjs/blob/main/docs/assemblerjs/features/events.md) - Event-driven architecture
- [Tags](https://github.com/benoitlahoz/assemblerjs/blob/main/docs/assemblerjs/features/tags.md) - Group assemblages
- [Singleton vs Transient](https://github.com/benoitlahoz/assemblerjs/blob/main/docs/assemblerjs/features/singleton-transient.md) - Instance lifecycle

#### API Reference
- [Assembler API](https://github.com/benoitlahoz/assemblerjs/blob/main/docs/assemblerjs/api/assembler.md) - Container methods
- [AssemblerContext API](https://github.com/benoitlahoz/assemblerjs/blob/main/docs/assemblerjs/api/context.md) - Context interface
- [Types](https://github.com/benoitlahoz/assemblerjs/blob/main/docs/assemblerjs/api/types.md) - TypeScript types

#### Guides
- [Advanced Examples](https://github.com/benoitlahoz/assemblerjs/blob/main/docs/assemblerjs/guides/advanced-examples.md) - Real-world patterns
- [Tree-Shaking](https://github.com/benoitlahoz/assemblerjs/blob/main/docs/assemblerjs/guides/tree-shaking.md) - Bundle optimization

#### Performance
- [Benchmarks](https://github.com/benoitlahoz/assemblerjs/blob/main/docs/assemblerjs/performance/benchmarks.md) - Performance metrics & best practices

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
