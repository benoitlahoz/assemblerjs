# Process Boundaries

`@assemblerjs/electron` is designed around strict process responsibilities.

## Main Process

Main process owns:

- Electron runtime lifecycle
- native APIs and OS integration
- BrowserWindow creation and orchestration
- privileged IPC handlers

Typical imports:

```typescript
import {
  IpcListener,
  IpcSend,
  Window,
  WindowController,
} from '@assemblerjs/electron';
```

## Preload Process

Preload owns:

- safe and explicit API exposure to renderer
- channel filtering and strict mode enforcement
- bridge-level diagnostics during integration

Typical import:

```typescript
import { setupIpcBridge } from '@assemblerjs/electron/preload';
```

## Renderer Process

Renderer owns:

- UI-facing service layer
- window-scoped orchestration through `@Window({ name })`
- typed IPC invocation through decorators and services

Typical imports:

```typescript
import {
  IpcInvoke,
  WindowCommand,
  AbstractWindowService,
} from '@assemblerjs/electron/renderer';
```

## Recommended Rule

Keep renderer code independent from raw bridge access whenever possible:

- preferred: UI -> renderer service/gateway -> bridge
- avoid: UI -> `window.ipc` direct calls scattered across components

This keeps IPC contracts centralized, testable, and easier to evolve.
