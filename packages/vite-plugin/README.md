# vite-plugin-assemblerjs

A Vite plugin for seamless [AssemblerJS](https://github.com/benoitlahoz/assemblerjs) integration with zero-configuration.

## Features

- ✅ **Auto-configure SWC** - Automatically sets up decorator metadata transformation
- ✅ **Auto-inject reflect-metadata** - No need to manually import at entry point
- ✅ **Zero Configuration** - Works out of the box with sensible defaults
- 🔧 **Customizable** - Override any option as needed

## Installation

```bash
npm install vite-plugin-assemblerjs --save-dev
```

```bash
yarn add vite-plugin-assemblerjs --dev
```

## Usage

### Basic Setup

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import assemblerjs from 'vite-plugin-assemblerjs';

export default defineConfig({
  plugins: [
    assemblerjs()
  ]
});
```

That's it! No need to:
- ❌ Manually configure SWC
- ❌ Import `reflect-metadata` in your code
- ❌ Set up decorator metadata transformation

### Advanced Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import assemblerjs from 'vite-plugin-assemblerjs';

export default defineConfig({
  plugins: [
    assemblerjs({
      // SWC configuration
      swc: {
        enabled: true,              // Default: true
        target: 'es2021',           // Default: 'es2021'
        keepClassNames: true,       // Default: true (required for DI)
      },
      
      // reflect-metadata injection
      reflectMetadata: {
        autoInject: true,           // Default: true
        injectMode: 'entry',        // 'entry' | 'inline' | 'manual'
      }
    })
  ]
});
```

## Configuration Options

### `swc`

Configure SWC transformation behavior:

- **`enabled`** (`boolean`, default: `true`) - Enable automatic SWC configuration
- **`target`** (`string`, default: `'es2021'`) - Target ECMAScript version
- **`keepClassNames`** (`boolean`, default: `true`) - Preserve class names (critical for DI)

### `reflectMetadata`

Configure reflect-metadata injection:

- **`autoInject`** (`boolean`, default: `true`) - Automatically inject reflect-metadata
- **`injectMode`** (`'entry' | 'inline' | 'manual'`, default: `'entry'`) - How to inject:
  - `entry`: Inject at application entry point (recommended)
  - `inline`: Inline in the bundle
  - `manual`: No automatic injection (you manage it)

## How It Works

1. **SWC Configuration**: The plugin automatically configures `@rollup/plugin-swc` with the correct settings for AssemblerJS decorators
2. **Metadata Injection**: Injects `reflect-metadata` polyfill at build time
3. **Zero Config**: Everything just works without manual setup

## Example Project

```typescript
// src/main.ts
// No need to import 'reflect-metadata'!
import { Assemblage, Assembler } from 'assemblerjs';

@Assemblage()
class Logger {
  log(message: string) {
    console.log(message);
  }
}

@Assemblage({
  inject: [[Logger]]
})
class App {
  constructor(private logger: Logger) {}
  
  start() {
    this.logger.log('App started!');
  }
}

const app = Assembler.build(App);
app.start();
```

## Requirements

- **Vite**: >= 5.0.0
- **AssemblerJS**: >= 1.0.0
- **Node.js**: >= 18.12.0

## License

MIT
