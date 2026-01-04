# TypeScript Setup

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

## Configuration Options

### experimentalDecorators

Enables TypeScript's decorator support, required for `@Assemblage`, `@Context()`, and other decorators.

### emitDecoratorMetadata

Emits design-time type metadata for decorated declarations, used by `reflect-metadata` for dependency injection.

### target & module

- **target:** `ES2020` or higher for modern JavaScript features
- **module:** `ESNext` for optimal tree-shaking and ESM support

## Example Project Structure

```
my-project/
├── src/
│   ├── index.ts          # Entry point (import 'reflect-metadata' here)
│   ├── app.ts            # Main application
│   └── services/
│       └── logger.ts     # Services
├── package.json
└── tsconfig.json         # TypeScript configuration
```

## Next Steps

- [Quick Start Guide](./quick-start.md) - Build your first application
- [Core Concepts](../core-concepts/assemblage.md) - Understand assemblages
