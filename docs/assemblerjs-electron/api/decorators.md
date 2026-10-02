# Decorators Reference

This page documents the main decorators exposed by `@assemblerjs/electron`, their usage, and practical behavior.

## Scope Overview

- Main process decorators are imported from `@assemblerjs/electron`.
- Renderer process decorators are imported from `@assemblerjs/electron/renderer`.
- Window decorators exist on both sides with different responsibilities.
- Menu decorators exist on both sides (main menu definition vs renderer menu interaction).

## Main Process Decorators

### `@IpcListener()`

Registers IPC metadata declared on class methods (`@IpcHandle`, etc.) against Electron main IPC.

Use on services that host IPC handlers.

```typescript
import { Assemblage } from 'assemblerjs';
import { IpcListener, IpcHandle } from '@assemblerjs/electron';

@IpcListener()
@Assemblage()
class AppIpcService {
  @IpcHandle('app:get-versions')
  getVersions() {
    return process.versions;
  }
}
```

### `@IpcInvoke(channel, options?)`

Invokes a renderer handler from main. Typical usage is main -> renderer symmetric RPC.

```typescript
import { Assemblage } from 'assemblerjs';
import { IpcInvoke, IpcResult } from '@assemblerjs/electron';

@Assemblage()
class MainDiagnostics {
  @IpcInvoke('renderer:get-metrics', { name: 'main', timeoutMs: 3000 })
  async pull(@IpcResult() result?: { averageLatencyMs?: number }) {
    return result;
  }
}
```

Notes:

- `name` targets a specific window identity.
- `timeoutMs` protects against hanging calls.

### `@IpcSend(channel, name?)`

Sends an event-style IPC message from main to renderer.

Use for notifications where no response is required.

### `@IpcWait(channel)`

Registers a one-time async wait flow on main for a single IPC response pattern.

Use sparingly for specialized one-shot orchestration.

### `@ToIpcResult()`

Wraps method return/errors into a normalized IPC result shape (`{ data, err }`).

Use when you want explicit transport-level success/error payloads.

## Renderer Process Decorators

### `@IpcListener()`

Activates renderer-side IPC metadata on the class.

Required when renderer methods are intended to handle main -> renderer calls.

### `@IpcHandle(channel, withEvent?)`

Declares a renderer handler for a channel.

```typescript
import { Assemblage } from 'assemblerjs';
import { IpcHandle, IpcListener } from '@assemblerjs/electron/renderer';

@IpcListener()
@Assemblage()
class RendererDiagnostics {
  @IpcHandle('renderer:get-metrics')
  getMetrics() {
    return { feedback: 'ok', averageLatencyMs: 10 };
  }
}
```

### `@IpcInvoke(channel?)`

Invokes main handlers from renderer and awaits a response.

### `@IpcSend(channel?)`

Sends fire-and-forget messages from renderer to main.

### `@IpcResult()`

Injects/decorates the IPC result in method parameters for decorator-driven method signatures.

## Window Decorators (Main)

### `@Window(definition)`

Declares window metadata (name, dimensions, lifecycle wiring) on main window classes.

```typescript
import { Assemblage } from 'assemblerjs';
import { ElectronWindow, Window } from '@assemblerjs/electron';

@Window({ name: 'main', width: 1280, height: 900, show: false })
@Assemblage({ singleton: false })
class MainWindow extends ElectronWindow {}
```

### `@WindowOn(event)`

Subscribes a class method to a BrowserWindow event.

### `@WindowEmit(eventOrChannel)`

Declares emission metadata for forwarding event results to renderer.

### `@WindowForward(event)`

Convenience decorator combining `@WindowOn(event)` and `@WindowEmit(event)`.

### `@WindowCommand(name?)`

Exposes a main window method as an invokable command.

If omitted, command name can be inferred from method name.

### `@WindowController(...)`

Applies window controller behavior and command orchestration to controller classes.

## Orchestration Decorators (Main)

### `@WindowOrchestrator()`

Composes the main window lifecycle stack into one class decorator.

It combines:

- `@WindowController()`
- `@MenuController()`
- `@AppListener()`

Use on the main window controller class when you want full lifecycle wiring with a single decorator.

### `@MenuOrchestrator()`

Composes main menu lifecycle behavior into one class decorator.

It combines:

- `@MenuController()`
- `@AppListener()`

Use when your class needs menu lifecycle orchestration and app event listener wiring.

## Window Decorators (Renderer)

### `@Window({ name })`

Binds a renderer service to a window identity and enables window metadata wiring.

### `@WindowCommand(name?)`

Marks renderer service methods as command-oriented calls through the window service abstraction.

### `@WindowOn(event)`

Subscribes renderer service methods to window event streams.

## Menu Decorators (Main)

### `@Menu({ name })`

Declares a managed main-process menu definition.

Notes:

- `@Menu` no longer accepts legacy window string config.
- window binding is handled with `@UseMenu(...)` on window classes.

### `@MenuItem(...)`

Declares menu items in menu classes.

Supported forms:

- class usage: `@MenuItem('Group Label')`
- method usage: `@MenuItem({ id, label, order, before, after, ... })`

### `@SubMenu(...)`

Declares submenu composition for menu nodes.

Supported forms include method definition and property/class resolver forms.

### `@MenuCommand(command)`

Marks a main menu method as a command exposed in menu metadata.

### `@MenuController()`

Adds menu lifecycle registration/disposal behavior to a controller class.

### `@UseMenu(...)`

Binds a window class to a menu reference or menu slot composition.

Use on managed window classes (main side) to attach menu trees to windows.

## Menu Decorators (Renderer)

### `@Menu(definition)`

Declares renderer-side menu binding metadata and applies listener behavior.

### `@MenuCommand(command)`

Invokes a menu command channel (scoped by window identity).

### `@MenuListener()`

Activates renderer-side menu event subscriptions declared via decorators.

### `@MenuOn(event)`

Subscribes renderer methods to menu event streams (`itemClicked`, `stateChanged`, `templateChanged`, etc.).

## Typical Usage Matrix

| Scenario                            | Process Side    | Decorators                                                    | Typical Usage                                    |
| ----------------------------------- | --------------- | ------------------------------------------------------------- | ------------------------------------------------ |
| Renderer -> Main request/response   | renderer + main | `@IpcInvoke` (renderer), `@IpcHandle` + `@IpcListener` (main) | Typed command/query call to main services        |
| Renderer -> Main event              | renderer        | `@IpcSend`                                                    | Fire-and-forget telemetry or signals             |
| Main -> Renderer request/response   | main + renderer | `@IpcInvoke` (main), `@IpcHandle` + `@IpcListener` (renderer) | Main-driven diagnostics/state pull               |
| Main window definition              | main            | `@Window`, `@WindowOn`, `@WindowCommand`                      | BrowserWindow lifecycle and command exposure     |
| Renderer window service             | renderer        | `@Window`, `@WindowCommand`, `@WindowOn`                      | Window-scoped UI service abstraction             |
| Full window lifecycle orchestration | main            | `@WindowOrchestrator`                                         | Compose app + menu + window controller lifecycle |
| Menu lifecycle orchestration        | main            | `@MenuOrchestrator`                                           | Compose menu lifecycle + app listener wiring     |
| Main menu model                     | main            | `@Menu`, `@MenuItem`, `@SubMenu`, `@MenuCommand`              | Declarative menu tree and commands               |
| Window to menu binding              | main            | `@UseMenu`                                                    | Bind a window to a menu reference or menu slots  |
| Renderer menu interaction           | renderer        | `@Menu`, `@MenuCommand`, `@MenuListener`, `@MenuOn`           | Observe menu state/events and invoke commands    |

## Best Practices

- Keep business channels explicit in preload `channels`.
- Use strict preload bridge mode and narrow auto-whitelist rules.
- Keep IPC access in services/gateways rather than UI components.
- Use one renderer window service per window identity.
- Prefer explicit command/channel names for public APIs.
