# Entry Points and Exports

`@assemblerjs/electron` publishes three entry points.

## Main Entry Point

Import path:

```typescript
import {} from '@assemblerjs/electron';
```

Main export surface includes:

- main IPC decorators (`IpcInvoke`, `IpcSend`, `IpcListener`, `IpcWait`)
- window decorators and classes (`Window`, `WindowController`, `ElectronWindow`)
- menu/window-menu orchestration services
- app and system-state modules

## Renderer Entry Point

Import path:

```typescript
import {} from '@assemblerjs/electron/renderer';
```

Renderer export surface includes:

- renderer IPC decorators (`IpcInvoke`, `IpcSend`, `IpcHandle`, `IpcListener`, `IpcResult`)
- renderer window decorators/services (`Window`, `WindowOn`, `WindowCommand`)
- window controller abstractions and default service implementation

## Preload Entry Point

Import path:

```typescript
import {} from '@assemblerjs/electron/preload';
```

Preload export surface includes:

- `setupIpcBridge`
- preload contracts and bridge types
- common channel helpers

## Global Types

The package also declares global typing for `window.ipc` to provide typed bridge access in renderer code.

## Recommendation

Keep each process importing only its dedicated entry point. This prevents accidental cross-process coupling and keeps dependency boundaries clear.
