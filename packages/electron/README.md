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

### Main Process

```typescript
import 'reflect-metadata';
import { app, BrowserWindow } from 'electron';
import { Assemblage, Assembler, AbstractAssemblage } from 'assemblerjs';

@Assemblage()
class WindowManager implements AbstractAssemblage {
  private mainWindow: BrowserWindow | null = null;

  async onInit() {
    await app.whenReady();
    this.createWindow();
  }

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
    });

    this.mainWindow.loadFile('index.html');
  }

  async onDispose() {
    this.mainWindow?.close();
  }
}

@Assemblage({
  provide: [[WindowManager]],
})
class ElectronApp implements AbstractAssemblage {
  constructor(private windowManager: WindowManager) {}

  async onInit() {
    console.log('Electron app started');
  }
}

// Bootstrap
const electronApp = Assembler.build(ElectronApp);
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

### Renderer Process

```typescript
import 'reflect-metadata';
import { Assemblage, Assembler, AbstractAssemblage } from 'assemblerjs';

declare global {
  interface Window {
    ipc: IpcBridge;
  }
}

@Assemblage()
class AppService implements AbstractAssemblage {
  sendMessage(message: string) {
    window.ipc.send('message', message);
  }

  onInit() {
    window.ipc.on('response', (data: any) => {
      console.log('Received:', data);
    });
  }
}

@Assemblage({
  provide: [[AppService]],
})
class RendererApp implements AbstractAssemblage {
  constructor(private appService: AppService) {}

  async onInit() {
    this.appService.sendMessage('Hello from renderer');
  }
}

const app = Assembler.build(RendererApp);
```

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
npx nx build electron

# Run tests
npx nx test electron

# Lint
npx nx lint electron
```

## License

MIT

---

Part of the [AssemblerJS monorepo](../../README.md)
