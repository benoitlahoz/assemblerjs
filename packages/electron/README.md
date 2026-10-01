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

## Multi-Window Orchestration

`name` identifies a window type; it is not an instance identifier. By default,
opening a managed window type reuses its existing instance. Set `multiple: true`
to create another `BrowserWindow` each time `openWindow` is called:

```typescript
import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { ElectronWindow, Window } from '@assemblerjs/electron';

@Window({ name: 'document', multiple: true, width: 1100, height: 760 })
@Assemblage()
class DocumentWindow extends ElectronWindow implements AbstractAssemblage {}
```

`@Window` marks the assemblage as non-singleton for DI. `multiple` controls the
window controller's reuse policy; setting only `singleton: false` does not make
`openWindow('document')` create another window.

The main-process window controller maintains the open-window registry. Resolve
it from the Assembler context when targeting windows outside the controller
class:

```typescript
import { useContext } from 'assemblerjs';
import { AbstractWindowController } from '@assemblerjs/electron';

const windows = useContext().require(AbstractWindowController);
const first = await windows.openWindow('document');
const second = await windows.openWindow('document');

const openWindows = windows.listWindows();
const sameTypeWindow = windows.getWindow('document');
const exactWindow = windows.getWindowById(second.id);

windows.closeWindow('document', second.id);
windows.closeAllWindows('document');
```

`getWindow(name)` returns one live instance of that type. `listWindowNames()`
can contain the same name more than once. Use the native `BrowserWindow.id` with
`getWindowById` and `closeWindow(name, id)` when the operation must target an
exact instance. Calling `closeWindow(name)` without an ID retains the
first-live-instance behavior.

### Window-Scoped IPC

Renderer window services and `@WindowCommand` declarations keep the same API
when multiple instances share a name. The command handler resolves the
originating `BrowserWindow` from the IPC sender internally, so the command runs
on the window whose renderer invoked it; applications do not need to pass a
window ID as an extra command argument.

```typescript
import { Assemblage } from 'assemblerjs';
import {
  ElectronWindow,
  Window as MainWindow,
  WindowCommand as MainWindowCommand,
} from '@assemblerjs/electron';
import {
  AbstractWindowService,
  IpcResult,
  Window as RendererWindow,
  WindowCommand as RendererWindowCommand,
} from '@assemblerjs/electron/renderer';

// Main process
@MainWindow({ name: 'document', multiple: true })
@Assemblage()
class DocumentWindow extends ElectronWindow {
  @MainWindowCommand()
  getDocumentTitle(): string {
    return this.getTitle();
  }
}

// Renderer process
@RendererWindow({ name: 'document' })
@Assemblage()
class DocumentService extends AbstractWindowService {
  @RendererWindowCommand()
  async getDocumentTitle(
    @IpcResult() title?: string,
  ): Promise<string | undefined> {
    return title;
  }
}
```

The renderer decorator invokes `window:document.getDocumentTitle`; the main
handler resolves the `BrowserWindow` from the IPC sender and invokes that
instance's method. No instance ID is added to the decorator or method arguments.

Main-process window events can be forwarded in the same way with `@WindowForward`.
The event is sent to that window's `webContents`; another window with the same
type does not receive it.

## Window and Global Menus

Bind a normal menu to each window with `@UseMenu`. The active window's menu is
installed when it is focused; menu registrations are tracked per window
instance, so two windows of the same type can have independent menu state.

An application can declare a global fallback menu with `@Menu({ global: true })`.
It is installed when no window-specific menu is active and restored when the
last window closes. Declare shared menu assemblages once in the root menu
controller's `provide` list; do not provide them again from `GlobalMenu`, or DI
will attempt to register the same assemblage identifier twice.

```typescript
import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import {
  BaseMenuController,
  ElectronMenu,
  Menu,
  MenuOrchestrator,
  SubMenu,
} from '@assemblerjs/electron';
import { AppMenu } from './app.menu';
import { FileMenu } from './file.menu';

@Menu({ name: 'globalMenu', global: true })
@Assemblage()
class GlobalMenu extends ElectronMenu implements AbstractAssemblage {
  constructor(
    public readonly appMenu: AppMenu,
    public readonly fileMenu: FileMenu,
  ) {
    super();
  }

  @SubMenu({ id: 'global.app', order: 10 })
  private app(): AppMenu {
    return this.appMenu;
  }

  @SubMenu({ id: 'global.file', order: 20 })
  private file(): FileMenu {
    return this.fileMenu;
  }
}

@MenuOrchestrator()
@Assemblage({ provide: [[AppMenu], [FileMenu], [GlobalMenu]] })
class MenuController extends BaseMenuController implements AbstractAssemblage {}
```

When no window is open, a global menu action has no target window.
`handleInMain` still runs, and its `windowName` argument is `undefined`;
renderer forwarding is available only when a target window exists.

For a menu action that needs to own a native dialog or target the exact
document window, `handleInMain` can receive the clicked `ElectronWindow` as its
third optional argument. Existing handlers that only accept the item ID and
window name remain compatible:

```typescript
@MenuItem({ id: 'file.open', label: 'Open Folder', handleInMain: true })
async openFolder(
  _itemId: string,
  _windowName?: string,
  targetWindow?: ElectronWindow,
): Promise<void> {
  const selection = targetWindow
    ? await dialog.showOpenDialog(targetWindow, { properties: ['openDirectory'] })
    : await dialog.showOpenDialog({ properties: ['openDirectory'] });
}
```

This is useful when several windows share the same `name`: use the supplied
window directly instead of looking it up by type name or passing its native ID
through application code. A global-menu action with no open window receives
`undefined` for `targetWindow`.

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
