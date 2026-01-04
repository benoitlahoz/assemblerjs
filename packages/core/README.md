# @assemblerjs/core

Internal utilities package for the AssemblerJS ecosystem.

## Overview

`@assemblerjs/core` provides shared utilities used across all AssemblerJS packages. When building applications with `assemblerjs`, you'll commonly need to import utilities from this package, such as `Task` and other helper types.

This package is automatically installed as a dependency of `assemblerjs`, but it's designed to be imported directly in your code alongside the main library.

## What's Inside

This package contains commonly used utilities:

- **Task** - Async task utilities for concurrent operations
- **Type utilities and helpers** - Generic TypeScript types and type guards
- **Collection management** - Utilities for working with arrays, maps, and sets
- **Error handling** - Custom error classes and error utilities
- **Conditional utilities** - Helper functions for conditional logic
- **Array manipulation** - Enhanced array operations

## Installation

This package is automatically installed as a dependency when you install `assemblerjs`:

```bash
npm install assemblerjs
# @assemblerjs/core is installed automatically
```

You can also install it independently if you only need the core utilities:

```bash
npm install @assemblerjs/core
# or
yarn add @assemblerjs/core
```

## Usage

When building applications with AssemblerJS, you'll commonly import utilities from this package:

```typescript
import { Task } from '@assemblerjs/core';
import { Assemblage, Assembler, AbstractAssemblage } from 'assemblerjs';

@Assemblage()
class MyService implements AbstractAssemblage {
  async processItems(items: string[]) {
    // Use Task for concurrent operations
    const results = await Task.all(
      items.map(item => this.processItem(item))
    );
    return results;
  }

  private async processItem(item: string) {
    // Process individual item
    return item.toUpperCase();
  }
}
```

### Common Exports

```typescript
// Task utilities for async operations
import { Task } from '@assemblerjs/core';

// Type utilities
import { /* type helpers */ } from '@assemblerjs/core';

// Collection utilities
import { /* collection helpers */ } from '@assemblerjs/core';
```

## For Contributors

### Development

```bash
# Build the package
npx nx build core

# Run tests
npx nx test core

# Lint
npx nx lint core
```

### Package Dependencies

This package is a dependency of:
- `assemblerjs` - Core DI library
- `@assemblerjs/electron` - Electron integration
- `@assemblerjs/mongo` - MongoDB integration
- `@assemblerjs/rest` - REST framework

## Architecture

As an internal package, `@assemblerjs/core` follows these principles:

- **Zero external dependencies** - Keeps the dependency tree minimal
- **Pure utilities** - No side effects or global state
- **Tree-shakable** - Optimized for bundle size
- **Type-safe** - Full TypeScript support

## License

MIT

---

Part of the [AssemblerJS monorepo](../../README.md)
