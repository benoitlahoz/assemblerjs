# Security and Reliability

This guide covers baseline safeguards for production Electron apps.

## Security Baseline

Always enforce secure BrowserWindow defaults:

```typescript
webPreferences: {
  contextIsolation: true,
  nodeIntegration: false,
  preload,
}
```

## Preload Bridge Hardening

- keep `strict: true` in preload bridge config
- whitelist only required channels
- avoid wildcard channel patterns in production
- run with `debug: false` in production builds

## IPC Hygiene

- keep channel naming conventions consistent
- validate payload shapes in service boundaries
- avoid passing non-serializable payloads
- remove handlers/listeners during disposal

## Lifecycle Cleanup

Use AssemblerJS lifecycle hooks:

- `onInit` for subscriptions and registrations
- `onDispose` for listener/handler cleanup

Typical cleanup tasks:

- `ipcMain.removeHandler(channel)`
- unsubscribe renderer listeners
- close windows/resources controlled by the service

## Failure Modes to Prevent

1. Channel mismatch between preload allowlist and service decorators.
2. Duplicate window creation under startup races.
3. Unbounded listener growth from missing cleanup.
4. IPC usage from UI code without service boundaries.

## Operational Checklist

Before shipping:

- run build and lint for both package and example
- run integration scenario covering open/close/reopen windows
- verify strict preload rejects unknown channels
- verify disposal clears listeners and handlers
