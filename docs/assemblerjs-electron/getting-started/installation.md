# Installation

## Requirements

- Node.js >= 18.12.0
- TypeScript >= 5.0
- Electron (supported peer range in package)
- Reflect metadata at runtime

## Install Dependencies

```bash
npm install assemblerjs @assemblerjs/electron electron reflect-metadata
```

```bash
yarn add assemblerjs @assemblerjs/electron electron reflect-metadata
```

## Import Reflect Metadata

At your application entry point:

```typescript
import 'reflect-metadata';
```

## TypeScript Configuration

Enable decorators and metadata in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "target": "ES2020",
    "module": "ESNext"
  }
}
```

## Package Entry Points

Use the process-specific package entry points:

```typescript
import {} from '@assemblerjs/electron';
import {} from '@assemblerjs/electron/renderer';
import {} from '@assemblerjs/electron/preload';
```
