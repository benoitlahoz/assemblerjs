# @assemblerjs/electron

Electron integration for AssemblerJS with type-safe IPC communication between main, renderer, and preload processes.

## Overview

`@assemblerjs/electron` brings AssemblerJS dependency injection to Electron applications with a single architecture style across all process boundaries.

It provides:

- typed process-specific entry points (`main`, `renderer`, `preload`)
- decorator-based IPC contracts
- renderer window services and multi-window orchestration utilities
- strict preload bridge configuration for safer IPC access

## Features

- **Main Process Integration** - Use AssemblerJS DI inside Electron main services and window modules.
- **Renderer Process Integration** - Build renderer-side services around explicit window identities.
- **Preload Bridge** - Expose a controlled IPC API to renderer code.
- **Type-safe IPC** - Keep channel usage and payloads typed with TypeScript.
- **Symmetric RPC Support** - Support both `renderer -> main` and `main -> renderer` flows.
- **Lifecycle Management** - Use AssemblerJS lifecycle hooks for registration and cleanup.

## Installation

Install runtime dependencies:

```bash
npm install @assemblerjs/electron assemblerjs electron reflect-metadata
```

```bash
yarn add @assemblerjs/electron assemblerjs electron reflect-metadata
```

## Package Exports

The package exposes three process-specific entry points:

```typescript
// Main process API
import {} from '@assemblerjs/electron';

// Renderer process API
import {} from '@assemblerjs/electron/renderer';

// Preload API
import {} from '@assemblerjs/electron/preload';
```

## Quick Start

The recommended architecture (used in `examples/seamless-electron`) is:

- one main bootstrap assemblage
- one main-side window class per real window
- one renderer-side window service per window identity
- one preload bridge that explicitly whitelists channels

### Main Process Bootstrap

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

Assembler.build(MainApp).catch(() => app.quit());
```

### Main Window Class

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

### Preload Bridge

```typescript
import { setupIpcBridge } from '@assemblerjs/electron/preload';

setupIpcBridge({
  channels: ['ping', 'pong', 'get-versions', 'get-platform'],
  strict: true,
});
```

This exposes `window.ipc` to renderer code.

To troubleshoot integration:

```typescript
setupIpcBridge({
  channels: ['ping', 'pong'],
  strict: true,
  debug: true,
});
```

Debug mode logs merged channels, auto-whitelist rules, and strict-mode rejections.

### Renderer Window Service

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
class MainWindowService extends AbstractWindowService {
  @WindowCommand('refreshBounds')
  async refreshBounds(
    @IpcResult() bounds?: WindowBounds,
  ): Promise<WindowBounds | undefined> {
    return bounds;
  }
}
```

Prefer calling IPC through renderer services/gateways rather than directly from UI components.

```typescript
import { useContext } from 'assemblerjs';
import { MainWindowService } from '@windows/main/renderer';

const mainWindow = useContext().require(MainWindowService);
await mainWindow.refreshBounds();
```

## IPC Communication

### Renderer to Main

Use native `invoke/handle` semantics with typed wrappers:

- renderer side: `@IpcSend`, `@IpcInvoke`
- main side: listeners and handlers

### Main to Renderer (Symmetric RPC)

`main -> renderer` can be implemented with:

- main side: `@IpcInvoke(...)`
- renderer side: `@IpcHandle(...)`

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

## Renderer Window Pattern

The renderer window layer is split into:

- `AbstractWindowControllerService` for global renderer window orchestration
- `WindowControllerService` as the default implementation
- `AbstractWindowService` for one service bound to one window
- `@Window({ name })` for window binding and listener metadata

`@WindowCommand` supports convention over configuration:

```typescript
@Window({ name: 'main' })
@Assemblage()
class MainWindowService extends AbstractWindowService {
  @WindowCommand()
  async getBounds() {
    // command name inferred as "getBounds"
  }

  @WindowCommand('refresh-bounds')
  async refreshBounds() {
    return this.getBounds();
  }
}
```

## Best Practices

1. Keep process responsibilities clear.
2. Route IPC calls through services/gateways.
3. Keep preload bridge strict and explicit.
4. Enable `contextIsolation` and disable `nodeIntegration`.
5. Use lifecycle hooks (`onInit`, `onDispose`) for cleanup.

## Documentation

- Electron docs (detailed): `docs/assemblerjs-electron`
- Working example: `examples/seamless-electron`

## Requirements

- **Node.js:** >= 18.12.0
- **Electron:** >= 30.0.0
- **TypeScript:** >= 5.0
- **reflect-metadata:** required

## Contributor Commands

```bash
npx nx build assemblerjs-electron
npx nx test assemblerjs-electron
npx nx lint assemblerjs-electron
```

## License

MIT

Part of the [AssemblerJS monorepo](../../README.md)
