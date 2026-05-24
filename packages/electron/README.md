# @assemblerjs/electron

Electron integration for AssemblerJS with type-safe IPC communication between main process, renderer process, and preload scripts.

## Overview

`@assemblerjs/electron` brings the power of AssemblerJS dependency injection to Electron applications, providing a unified architecture across all Electron processes with type-safe inter-process communication (IPC).

## Features

- 🔌 **Main Process Integration** - Use AssemblerJS DI in Electron's main process
- 🖥️ **Renderer Process Support** - DI for renderer processes
- 🔗 **Preload Scripts** - Bridge main and renderer with type-safety
- 🎯 **Type-safe IPC** - Full TypeScript support for IPC communication
- 🏗️ **Unified Architecture** - Same patterns across all processes
- ♻️ **Lifecycle Management** - Proper cleanup and resource management

## Installation

```bash
npm install @assemblerjs/electron assemblerjs electron reflect-metadata
# or
yarn add @assemblerjs/electron assemblerjs electron reflect-metadata
```

## Package Exports

The package provides three entry points for different Electron contexts:

```typescript
// Main process
import {} from /* ... */ '@assemblerjs/electron';

// Renderer process
import {} from /* ... */ '@assemblerjs/electron/renderer';

// Preload script
import {} from /* ... */ '@assemblerjs/electron/preload';
```

## Quick Start

The recommended usage follows the `examples/electron-01/src/windows` architecture:

- main bootstrap wires a window controller module
- each real window is a class in `src/windows/*/main`
- renderer uses one scoped service per window in `src/windows/*/renderer`

### Main Process (`src/main/index.ts` + `src/windows/main`)

```typescript
import 'reflect-metadata';
import { app } from 'electron';
import { join } from 'path';
import { AbstractAssemblage, Assemblage, Assembler } from 'assemblerjs';
import { ElectronAppModule } from '@features/app/main/app.module';
import { WindowControllerService } from '@windows/main';

@Assemblage({
  provide: [[ElectronAppModule], [WindowControllerService]],
  global: {
    preload: join(__dirname, '../preload/index.js'),
  },
})
class MainApp implements AbstractAssemblage {
  constructor(
    public electron: ElectronAppModule,
    public windows: WindowControllerService,
  ) {}
}

// Bootstrap
Assembler.build(MainApp).catch(() => app.quit());
```

Main window class (from `src/windows/main/main/main.window.ts`):

```typescript
import { AbstractAssemblage, Assemblage, Global } from 'assemblerjs';
import { ElectronWindow, Window } from '@assemblerjs/electron';

@Window({
  name: 'main',
  width: 1280,
  height: 900,
  show: false,
})
@Assemblage({ singleton: false })
class MainWindow extends ElectronWindow implements AbstractAssemblage {
  constructor(@Global('preload') preload: string) {
    super({ webPreferences: { preload } });
  }
}
```

### Preload Script

```typescript
import { setupIpcBridge } from '@assemblerjs/electron/preload';

setupIpcBridge({
  channels: ['ping', 'pong', 'get-versions', 'get-platform'],
  strict: true,
});
```

This exposes `window.ipc` in the renderer process.

For diagnostics during integration, enable debug mode:

```typescript
setupIpcBridge({
  channels: ['ping', 'pong'],
  strict: true,
  debug: true,
});
```

Debug mode logs:

- merged allowed channels
- active auto-whitelist rules
- rejected channels in strict mode

Importing the preload entry point exposes the following global in the renderer:

- `window.ipc` for the AssemblerJS IPC bridge

### Renderer Process (`src/windows/main/renderer/main.window.ts`)

```typescript
import { Assemblage } from 'assemblerjs';
import {
  AbstractWindowService,
  IpcResult,
  Window,
  WindowCommand,
  type WindowBounds,
} from '@assemblerjs/electron/renderer';
import { MAIN_WINDOW_CONFIG } from '../universal/window.config';

@Window({ name: MAIN_WINDOW_CONFIG.name })
@Assemblage()
class MainWindow extends AbstractWindowService {
  @WindowCommand('refreshBounds')
  async refreshBounds(
    @IpcResult() bounds?: WindowBounds,
  ): Promise<WindowBounds | undefined> {
    return bounds;
  }
}
```

In Vue components, inject this service instead of calling `window.ipc` directly.

```typescript
import { useContext } from 'assemblerjs';
import { MainWindow } from '@windows/main/renderer';

const mainWindow = useContext().require(MainWindow);
await mainWindow.refreshBounds();
```

This is the pattern used in `examples/electron-01/src/windows`.

## IPC Communication Example

### Main Process - IPC Handler

```typescript
import { ipcMain } from 'electron';
import { Assemblage, AbstractAssemblage } from 'assemblerjs';

@Assemblage()
class IpcService implements AbstractAssemblage {
  onInit() {
    ipcMain.on('message', (event, data) => {
      console.log('Received from renderer:', data);
      event.reply('response', { status: 'ok', data });
    });

    ipcMain.handle('get-data', async () => {
      return { result: 'Some data' };
    });
  }

  onDispose() {
    ipcMain.removeAllListeners('message');
    ipcMain.removeHandler('get-data');
  }
}
```

### Renderer - IPC Client

```typescript
@Assemblage()
class DataService implements AbstractAssemblage {
  async getData() {
    const result = await window.ipc.invoke('get-data');
    return result;
  }
}
```

## Symmetric RPC (Main <-> Renderer)

`renderer -> main` uses native `invoke/handle`.

`main -> renderer` is supported through the package RPC bridge using the same decorators:

- main side: `@IpcInvoke(...)`
- renderer side: `@IpcHandle(...)`

### Main invokes renderer

```typescript
import { Assemblage, AbstractAssemblage } from 'assemblerjs';
import { IpcInvoke, IpcResult } from '@assemblerjs/electron';

@Assemblage()
class MainDiagnostics implements AbstractAssemblage {
  @IpcInvoke('renderer:get-metrics', { name: 'main', timeoutMs: 3000 })
  async pullRendererMetrics(
    @IpcResult() metrics?: { feedback: string; averageLatencyMs?: number },
  ): Promise<void> {
    console.log('Renderer metrics:', metrics);
  }
}
```

### Renderer handles main invocation

```typescript
import { Assemblage, AbstractAssemblage } from 'assemblerjs';
import { IpcHandle, IpcListener } from '@assemblerjs/electron/renderer';

@IpcListener()
@Assemblage()
class RendererDiagnostics implements AbstractAssemblage {
  @IpcHandle('renderer:get-metrics')
  async getMetrics(): Promise<{ feedback: string; averageLatencyMs?: number }> {
    return {
      feedback: 'ok',
      averageLatencyMs: 12,
    };
  }
}
```

Notes:

- this flow is opt-in and backward compatible with existing event and invoke patterns
- `setupIpcBridge` strict mode and channel whitelist still apply
- for maintainability, keep IPC calls inside services/gateways rather than UI components

## Architecture Patterns

### Renderer Window Services

The renderer window layer uses a controller + scoped service split:

- `AbstractWindowControllerService`: global multi-window controller in renderer
- `WindowControllerService`: default renderer implementation using IPC
- `AbstractWindowService`: base class for one window service bound to a window name
- `@Window({ name })`: binds a renderer service to a window and auto-applies listener metadata

```typescript
import { Assemblage } from 'assemblerjs';
import {
  AbstractWindowService,
  Window,
  WindowCommand,
} from '@assemblerjs/electron/renderer';

@Window({ name: 'main' })
@Assemblage()
class MainWindowService extends AbstractWindowService {
  @WindowCommand('refresh-bounds')
  async refreshBounds() {
    return await this.getBounds();
  }
}
```

Notes:

- prefer `@Window` on renderer window services
- keep one service per window for clear ownership
- inject `AbstractWindowControllerService` when you need to orchestrate multiple windows

### Service Layer

```typescript
// Main process
@Assemblage()
class DatabaseService implements AbstractAssemblage {
  private db: any;

  async onInit() {
    this.db = await this.connect();
  }

  async query(sql: string) {
    return this.db.query(sql);
  }

  async onDispose() {
    await this.db.close();
  }
}

@Assemblage({
  provide: [[DatabaseService]],
})
class UserRepository implements AbstractAssemblage {
  constructor(private db: DatabaseService) {}

  async findById(id: string) {
    return this.db.query(`SELECT * FROM users WHERE id = ${id}`);
  }
}
```

### Window Management

```typescript
@Assemblage()
class MultiWindowManager implements AbstractAssemblage {
  private windows = new Map<string, BrowserWindow>();

  createWindow(id: string, options: BrowserWindowConstructorOptions) {
    const window = new BrowserWindow(options);
    this.windows.set(id, window);
    return window;
  }

  getWindow(id: string) {
    return this.windows.get(id);
  }

  closeWindow(id: string) {
    const window = this.windows.get(id);
    window?.close();
    this.windows.delete(id);
  }

  async onDispose() {
    for (const window of this.windows.values()) {
      window.close();
    }
    this.windows.clear();
  }
}
```

## Best Practices

### 1. **Process Separation**

Keep main and renderer logic separated. Use IPC for communication:

```typescript
// ✅ Good - Separate concerns
// Main: File system, native APIs
// Renderer: UI logic
```

### 1.1 **Integration Simplicity (Recommended)**

Use a renderer service/gateway as the single IPC access point.

```typescript
// ✅ Recommended
// UI component -> service/gateway -> window.ipc

// Avoid calling window.ipc directly from UI components.
```

### 2. **Security**

Always use `contextIsolation` and disable `nodeIntegration`:

```typescript
webPreferences: {
  nodeIntegration: false,
  contextIsolation: true,
  preload: path.join(__dirname, 'preload.js')
}
```

### 3. **Resource Cleanup**

Use lifecycle hooks for proper cleanup:

```typescript
@Assemblage()
class ResourceManager implements AbstractAssemblage {
  async onDispose() {
    // Clean up resources
    await this.cleanup();
  }
}
```

## Requirements

- **Node.js:** ≥ 18.12.0
- **Electron:** ≥ 28.0.0
- **TypeScript:** ≥ 5.0
- **reflect-metadata:** Required

## For Contributors

### Development

```bash
# Build the package
npx nx build assemblerjs-electron

# Run tests
npx nx test assemblerjs-electron

# Lint
npx nx lint assemblerjs-electron
```

## License

MIT

---

Part of the [AssemblerJS monorepo](../../README.md)
