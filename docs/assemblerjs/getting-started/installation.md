# Installation

## Package Installation

Install `assemblerjs` and its peer dependency `reflect-metadata`:

```sh
npm install assemblerjs reflect-metadata
```

```sh
yarn add assemblerjs reflect-metadata
```

## Important Setup

You must import `reflect-metadata` at the entry point of your application:

```typescript
import 'reflect-metadata';
```

This enables the reflection metadata that `assemblerjs` uses for dependency injection.

## Requirements

- **Node.js:** ≥ 18.12.0
- **TypeScript:** ≥ 5.0 (with decorator support)
- **reflect-metadata:** Required for dependency injection

## Next Steps

- [Quick Start Guide](./quick-start.md) - Build your first application
- [TypeScript Setup](./typescript-setup.md) - Configure TypeScript for decorators
