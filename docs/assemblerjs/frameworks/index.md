# Browser & Framework Integration

assembler.js is a **universal dependency injection library** that works seamlessly in all JavaScript environments, including browsers and popular frontend frameworks.

## 🌐 Why assembler.js for the Browser?

- **Zero platform dependencies** - No Node.js-specific code
- **Small bundle size** - ~5-6 KB minified with tree-shaking
- **Framework agnostic** - Works with any framework or vanilla JS
- **Type-safe** - Full TypeScript support
- **Modern ESM** - Optimized for modern bundlers

## Supported Environments

### ✅ Vanilla JavaScript
Pure JavaScript applications without any framework. Perfect for:
- Landing pages with interactive components
- Browser extensions
- Progressive Web Apps (PWAs)
- Web Components

[→ Vanilla JS Guide](./vanilla.md)

### ⚛️ React
Full integration with React hooks and component patterns:
- Custom hooks with `useAssemblage()`
- Context Provider pattern
- State management
- Async data fetching

[→ React Integration Guide](./react.md)

### 🟢 Vue 3
Works perfectly with Vue 3 Composition API:
- Composables with DI
- Provide/Inject integration
- Pinia-like stores
- Reactive state management

[→ Vue Integration Guide](./vue.md)

### 🔷 Solid.js
Leverages Solid's fine-grained reactivity:
- Signal-based state
- Store pattern
- Resource handling
- Context API

[→ Solid.js Integration Guide](./solid.md)

### 🔥 Svelte
Integrates with Svelte's reactive stores:
- Writable/Readable stores
- Derived stores
- Custom stores with methods
- Action directives

[→ Svelte Integration Guide](./svelte.md)

## Installation

Installation is the same for all environments:

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

### Framework-specific Entry Points

**React (Vite)**
```typescript
// src/main.tsx
import 'reflect-metadata';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
```

**Vue 3 (Vite)**
```typescript
// src/main.ts
import 'reflect-metadata';
import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
```

**Solid.js**
```typescript
// src/index.tsx
import 'reflect-metadata';
import { render } from 'solid-js/web';
import App from './App';

render(() => <App />, document.getElementById('root')!);
```

**Svelte**
```typescript
// src/main.ts
import 'reflect-metadata';
import App from './App.svelte';

const app = new App({ target: document.body });
export default app;
```

## Quick Example

Here's a universal example that works in any environment:

```typescript
import 'reflect-metadata';
import { Assemblage, Assembler, AbstractAssemblage } from 'assemblerjs';

// Define a service
@Assemblage()
class UserService implements AbstractAssemblage {
  private users = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ];

  getUsers() {
    return this.users;
  }

  getUser(id: number) {
    return this.users.find(u => u.id === id);
  }
}

// Use in your application
@Assemblage({
  inject: [[UserService]],
})
class App implements AbstractAssemblage {
  constructor(private userService: UserService) {}

  render() {
    const users = this.userService.getUsers();
    return users.map(u => `<div>${u.name}</div>`).join('');
  }
}

// Bootstrap
const app = Assembler.build(App);
console.log(app.render());
```

## Common Patterns

### Service Layer

Create reusable services that work across all frameworks:

```typescript
@Assemblage()
class ApiService implements AbstractAssemblage {
  private baseUrl = 'https://api.example.com';

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    return response.json();
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }
}
```

### State Management

Implement state management compatible with all frameworks:

```typescript
@Assemblage({
  events: ['state:changed'],
})
class AppStore implements AbstractAssemblage {
  private state: any = {};

  constructor(@Context() private context: AssemblerContext) {}

  setState(updates: any) {
    this.state = { ...this.state, ...updates };
    this.context.emit('state:changed', this.state);
  }

  getState() {
    return { ...this.state };
  }
}
```

### Async Operations

Handle async operations consistently:

```typescript
@Assemblage()
class DataLoader<T> implements AbstractAssemblage {
  private loading = false;
  private data: T | null = null;
  private error: Error | null = null;

  async load(fetcher: () => Promise<T>) {
    this.loading = true;
    this.error = null;

    try {
      this.data = await fetcher();
    } catch (err) {
      this.error = err as Error;
    } finally {
      this.loading = false;
    }
  }

  get state() {
    if (this.loading) return { status: 'loading' } as const;
    if (this.error) return { status: 'error', error: this.error } as const;
    if (this.data) return { status: 'success', data: this.data } as const;
    return { status: 'idle' } as const;
  }
}
```

## TypeScript Configuration

Ensure your `tsconfig.json` has these settings:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "bundler" // or "node"
  }
}
```

## Bundle Optimization

### Tree-Shaking

assembler.js is fully tree-shakeable. Only import what you need:

```typescript
// Good - Tree-shakeable
import { Assemblage, Assembler } from 'assemblerjs';

// Avoid - Imports everything
import * as AssemblerJS from 'assemblerjs';
```

### Bundle Size Examples

- **Minimal usage** (Assemblage + Assembler): ~5 KB
- **With Events**: ~6 KB
- **Full API**: ~8 KB

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'assemblerjs': ['assemblerjs'],
        },
      },
    },
  },
});
```

## Browser Compatibility

assembler.js works in all modern browsers:

- Chrome 80+
- Firefox 75+
- Safari 13.1+
- Edge 80+

For older browsers, use a polyfill for:
- `Reflect.metadata` (included with `reflect-metadata`)
- ES2020 features (if targeting older browsers)

## Next Steps

Choose your framework to see detailed integration guides:

- [Vanilla JavaScript](./vanilla.md) - Pure browser development
- [React](./react.md) - Hooks and components
- [Vue 3](./vue.md) - Composition API
- [Solid.js](./solid.md) - Fine-grained reactivity
- [Svelte](./svelte.md) - Reactive stores

## Examples

Check out our comprehensive test suite for real-world examples:
- [Vanilla JS Tests](../../../../packages/assemblerjs/e2e/browser/vanilla-basic.spec.ts)
- [React Tests](../../../../packages/assemblerjs/e2e/browser/react-integration.spec.tsx)
- [Vue Tests](../../../../packages/assemblerjs/e2e/browser/vue-integration.spec.ts)
- [Solid Tests](../../../../packages/assemblerjs/e2e/browser/solid-integration.spec.tsx)
- [Svelte Tests](../../../../packages/assemblerjs/e2e/browser/svelte-integration.spec.ts)
