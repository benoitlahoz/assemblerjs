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

## Works Everywhere 🌐

**The same installation works for all environments:**

### Node.js Applications

```typescript
// src/index.ts
import 'reflect-metadata';
import { Assemblage, Assembler } from 'assemblerjs';

// Your application code
```

### Browser Applications (React, Vue, Angular, etc.)

**No special setup needed!** Use the same installation with your bundler:

```typescript
// src/main.ts or src/index.ts
import 'reflect-metadata';
import { Assemblage, Assembler } from 'assemblerjs';

// Your application code
```

**Examples:**
- **Vite + React/Vue**: Import in `main.tsx` or `main.ts`
- **Next.js**: Import in `_app.tsx` or `pages/_app.tsx`
- **Angular**: Import in `main.ts`
- **Webpack**: Import in your entry file

### Alternative: CDN (Quick Prototyping)

If you want to try assemblerjs without npm/yarn or a build tool:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>assembler.js in Browser</title>
</head>
<body>
  <script src="https://unpkg.com/reflect-metadata@latest/Reflect.js"></script>
  <script type="module">
    import { Assemblage, Assembler } from 'https://unpkg.com/assemblerjs@latest/dist/index.js';
    // Your code here
  </script>
</body>
</html>
```

## Requirements

### For Node.js
- **Node.js:** ≥ 18.12.0
- **TypeScript:** ≥ 5.0 (with decorator support)
- **reflect-metadata:** Required for dependency injection

### For Browsers
- **Modern Browser:** Supporting ES2020+ (Chrome 80+, Firefox 75+, Safari 13.1+, Edge 80+)
- **reflect-metadata:** Required (load via CDN or bundle)
- **TypeScript:** ≥ 5.0 (if using TypeScript)

> 💡 **Bundle Size**: assemblerjs is optimized for browsers with tree-shaking support, resulting in a minimal bundle size (~5-6 KB for basic usage).

## Next Steps

- [Quick Start Guide](./quick-start.md) - Build your first application
- [TypeScript Setup](./typescript-setup.md) - Configure TypeScript for decorators
