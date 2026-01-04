# Tree-Shaking & Bundle Optimization

`assembler.js` is optimized for tree-shaking with modular exports. This guide shows how to minimize your bundle size.

## Quick Summary

- ✅ `"sideEffects": false` - Safe to remove unused modules
- ✅ Modular exports - Each feature in separate files
- ✅ ESM format - Native tree-shaking support
- 🎯 **Minimal usage** (~5-6 KB): Core DI features only
- 📦 **Medium usage** (~15-18 KB): DI + Events + Parameter decorators
- 📚 **Full library** (~35 KB): All features

## Import Best Practices

### ❌ Large Bundle (Imports Everything)

```typescript
import * as Assembler from 'assemblerjs';
```

This imports the entire library, even features you don't use.

### ✅ Optimal (Only Imports Required Modules)

```typescript
import { Assemblage, Assembler, AbstractAssemblage } from 'assemblerjs';
```

This imports only what you need, allowing bundlers to tree-shake unused code.

## Bundle Size Examples

### Minimal Usage (~5-6 KB)

Core DI features only:

```typescript
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
}

const app = Assembler.build(App);
```

**Bundle size:** ~5-6 KB (minified + gzipped)

**Includes:**
- Core DI container
- `@Assemblage` decorator
- Dependency injection
- Lifecycle hooks (`onInit`, `onDispose`)

### Medium Usage (~15-18 KB)

DI + Events + Parameter decorators:

```typescript
import { 
  Assemblage, 
  Assembler, 
  AbstractAssemblage, 
  EventManager,
  Context,
  Configuration,
  Dispose,
} from 'assemblerjs';

const Events = {
  CREATED: 'app:created',
};

@Assemblage({ events: Object.values(Events) })
class UserService 
  extends EventManager 
  implements AbstractAssemblage 
{
  constructor() {
    super(...Object.values(Events));
  }
  
  createUser(name: string) {
    this.emit(Events.CREATED, { name });
  }
}

@Assemblage({ inject: [[UserService]] })
class App implements AbstractAssemblage {
  constructor(
    @Context() private context: AssemblerContext,
    @Configuration() private config: any,
    @Dispose() public dispose: () => void,
    private users: UserService
  ) {
    context.on(Events.CREATED, (user) => {
      console.log('User created:', user);
    });
  }
}

const app = Assembler.build(App, { debug: true });
```

**Bundle size:** ~15-18 KB (minified + gzipped)

**Includes:**
- Everything from minimal
- Event system (`EventManager`)
- Parameter decorators (`@Context()`, `@Configuration()`, `@Dispose()`)
- AssemblerContext

### Full Library (~35 KB)

All features:

```typescript
import { 
  Assemblage, 
  Assembler, 
  AbstractAssemblage, 
  EventManager,
  Context,
  Configuration,
  Dispose,
  Use,
  Global,
  Definition,
  Optional,
  ParameterDecoratorFactory,
  createConstructorDecorator,
} from 'assemblerjs';

// ... using all features
```

**Bundle size:** ~35 KB (minified + gzipped)

**Includes:**
- Everything from medium
- All parameter decorators
- Custom decorator factories
- Tag system
- Global values
- Metadata system

## Optimizing Your Bundle

### 1. Import Only What You Need

```typescript
// ❌ Imports everything
import * as Assembler from 'assemblerjs';

// ✅ Imports only required features
import { Assemblage, Assembler, AbstractAssemblage } from 'assemblerjs';
```

### 2. Avoid Unused Features

If you don't need events, don't import `EventManager`:

```typescript
// If you're not using events
import { Assemblage, Assembler, AbstractAssemblage } from 'assemblerjs';
// Don't import: EventManager

// If you're not using custom decorators
// Don't import: ParameterDecoratorFactory, createConstructorDecorator
```

### 3. Use Native ES Modules

Ensure your bundler is configured for ESM:

```json
{
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

### 4. Enable Tree-Shaking in Your Bundler

#### Webpack

```javascript
module.exports = {
  mode: 'production',
  optimization: {
    usedExports: true,
    sideEffects: false,
  },
};
```

#### Rollup

```javascript
export default {
  treeshake: true,
  plugins: [
    // ... your plugins
  ],
};
```

#### Vite

Vite enables tree-shaking by default in production:

```javascript
export default {
  build: {
    minify: 'terser', // or 'esbuild'
  },
};
```

## Analyzing Your Bundle

### Using webpack-bundle-analyzer

```bash
npm install --save-dev webpack-bundle-analyzer
```

```javascript
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin(),
  ],
};
```

### Using rollup-plugin-visualizer

```bash
npm install --save-dev rollup-plugin-visualizer
```

```javascript
import { visualizer } from 'rollup-plugin-visualizer';

export default {
  plugins: [
    visualizer(),
  ],
};
```

### Using Vite's Built-in Analysis

```bash
npm run build -- --report
```

## Feature-by-Feature Size Impact

| Feature | Size Impact | When to Import |
|---------|-------------|----------------|
| Core DI | ~5 KB | Always (required) |
| Events | ~5 KB | When using event system |
| Parameter decorators | ~5 KB | When using `@Context()`, `@Configuration()`, etc. |
| Custom decorators | ~5 KB | When creating custom decorators |
| Tags | ~2 KB | When using tag system |
| Global values | ~1 KB | When using global values |

## Production Build Checklist

- [ ] Import only required features
- [ ] Enable tree-shaking in bundler
- [ ] Use production mode
- [ ] Enable minification
- [ ] Analyze bundle size
- [ ] Remove unused imports
- [ ] Use ESM format

## Comparison with Other DI Libraries

| Library | Minimal | Medium | Full |
|---------|---------|--------|------|
| assemblerjs | ~5 KB | ~15 KB | ~35 KB |
| InversifyJS | ~10 KB | ~20 KB | ~40 KB |
| tsyringe | ~6 KB | ~12 KB | ~25 KB |
| NestJS (DI only) | ~25 KB | ~50 KB | ~100+ KB |

*Sizes are approximate and based on minified + gzipped output.*

## Tips for Minimal Bundles

### 1. Don't Extend EventManager if Not Needed

```typescript
// ❌ Adds event system to bundle
@Assemblage()
class MyService 
  extends EventManager 
  implements AbstractAssemblage 
{}

// ✅ Smaller bundle
@Assemblage()
class MyService implements AbstractAssemblage {}
```

### 2. Use Direct Injection Instead of Context

```typescript
// ❌ Requires AssemblerContext (~3 KB)
@Assemblage({ inject: [[Logger]] })
class App implements AbstractAssemblage {
  constructor(@Context() private context: AssemblerContext) {
    this.logger = context.require(Logger);
  }
}

// ✅ Smaller bundle (direct injection)
@Assemblage({ inject: [[Logger]] })
class App implements AbstractAssemblage {
  constructor(private logger: Logger) {}
}
```

### 3. Avoid Custom Decorators for Simple Cases

```typescript
// ❌ Requires ParameterDecoratorFactory (~5 KB)
const Custom = ParameterDecoratorFactory.create({...});

// ✅ Use built-in features instead
@Assemblage({ use: [['service', myService]] })
class App implements AbstractAssemblage {
  constructor(@Use('service') private service: any) {}
}
```

## Next Steps

- [Getting Started](../getting-started/installation.md) - Install and setup
- [Core Concepts](../core-concepts/assemblage.md) - Learn the fundamentals
- [Advanced Examples](./advanced-examples.md) - See real-world patterns
- [API Reference](../api/assembler.md) - Detailed API documentation
