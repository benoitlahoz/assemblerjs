# IPC Patterns

This guide describes production-friendly IPC patterns with `@assemblerjs/electron`.

## Renderer to Main

Use renderer decorators to call main handlers.

### Invoke Pattern

```typescript
import { Assemblage } from 'assemblerjs';
import { IpcInvoke, IpcResult } from '@assemblerjs/electron/renderer';

@Assemblage()
class VersionsGateway {
  @IpcInvoke('app:get-versions')
  async getVersions(@IpcResult() data?: Record<string, string>) {
    return data;
  }
}
```

### Fire-and-Forget Pattern

```typescript
import { Assemblage } from 'assemblerjs';
import { IpcSend } from '@assemblerjs/electron/renderer';

@Assemblage()
class TelemetryGateway {
  @IpcSend('telemetry:track')
  async track(eventName: string, payload: unknown) {
    return [eventName, payload];
  }
}
```

## Main to Renderer (Symmetric RPC)

Use main-side `@IpcInvoke` to call renderer handlers.

```typescript
import { Assemblage, AbstractAssemblage } from 'assemblerjs';
import { IpcInvoke, IpcResult } from '@assemblerjs/electron';

@Assemblage()
class MainDiagnostics implements AbstractAssemblage {
  @IpcInvoke('renderer:get-metrics', { name: 'main', timeoutMs: 3000 })
  async pullRendererMetrics(
    @IpcResult() metrics?: { feedback: string; averageLatencyMs?: number },
  ): Promise<void> {
    console.log('renderer metrics', metrics);
  }
}
```

Renderer handler:

```typescript
import { Assemblage } from 'assemblerjs';
import { IpcHandle, IpcListener } from '@assemblerjs/electron/renderer';

@IpcListener()
@Assemblage()
class RendererDiagnostics {
  @IpcHandle('renderer:get-metrics')
  async getMetrics() {
    return { feedback: 'ok', averageLatencyMs: 12 };
  }
}
```

## Strict Bridge Configuration

```typescript
import { setupIpcBridge } from '@assemblerjs/electron/preload';

setupIpcBridge({
  channels: ['app:get-versions', 'telemetry:track', 'renderer:get-metrics'],
  strict: true,
  debug: false,
});
```

Use `debug: true` during integration to inspect rejected channels and merged allowlists.

## Auto-whitelist Rules

`autoWhitelist` is intended for dynamic channels that cannot be listed statically in `channels`.

Typical use cases:

- window-scoped runtime channels, for example `window:<name>.<command>`
- menu-scoped runtime channels, for example `menu:<name>.<command>`

Recommended approach:

- keep business/application channels explicit in `channels`
- use `autoWhitelist` only for pattern-based dynamic channels
- keep regex rules narrow to avoid over-permissive channel access

Example:

```typescript
setupIpcBridge({
  channels: ['app:get-versions', 'system-state:get-snapshot'],
  strict: true,
  autoWhitelist: [
    /^window:[A-Za-z0-9_-]+\.[A-Za-z0-9:_-]+$/,
    /^menu:[A-Za-z0-9_-]+\.[A-Za-z0-9:_-]+$/,
  ],
});
```

## Contract Design Tips

- Prefer explicit channel names over dynamic strings.
- Group channels by domain prefix (`app:`, `window:`, `system:`).
- Keep payloads small and serializable.
- Keep all channel declarations in one location.
- Prefer service-level methods over direct bridge calls from UI code.
