# seamless-electron

AssemblerJS Electron example showcasing:

- typed preload IPC bridge setup
- renderer -> main IPC (`@IpcSend`, `@IpcInvoke`)
- main -> renderer symmetric RPC (`@IpcInvoke` in main, `@IpcHandle` in renderer)
- window command/event patterns used by renderer window services
- renderer window service pattern with `@Window` + `AbstractWindowService`
- global renderer-side window orchestration with `AbstractWindowControllerService`

This example is part of the AssemblerJS monorepo and is intended as a practical reference for package consumers.

## Tech Stack

- Electron
- TypeScript
- AssemblerJS
- @assemblerjs/electron
- electron-vite

## Project Structure

- `src/preload`: preload bridge and IPC channel contracts
- `src/features/ipc/main`: main-side IPC listeners/handlers
- `src/features/ipc/renderer`: renderer-side gateways and handlers
- `src/windows/main/renderer`: renderer UI layer consuming service/gateway abstractions
- `src/windows/main/renderer/main.window.ts`: scoped renderer window service (`MainWindowService`)
- `src/windows/main/window.controller.ts`: main-side window controller module

## Architecture Summary

This example follows the same architecture recommended in `@assemblerjs/electron` docs:

1. Main process bootstraps one DI root and window orchestration services.
2. Preload exposes a strict, typed IPC bridge.
3. Renderer accesses IPC through dedicated services/gateways.
4. Window-specific logic lives in one renderer service per window identity.

## Getting Started

From the repository root:

```bash
yarn install
```

Run the example in development mode:

```bash
yarn workspace seamless-electron dev
```

## Scripts

From `examples/seamless-electron`:

```bash
yarn dev
yarn typecheck
yarn lint
yarn build
yarn test
```

Packaging scripts:

```bash
yarn build:win
yarn build:mac
yarn build:linux
```

## IPC Notes

The preload script exposes a strict IPC bridge via `setupIpcBridge` and a typed channel contract list.

Main and renderer communicate through decorators:

- renderer -> main: `@IpcSend`, `@IpcInvoke`
- main -> renderer: `@IpcInvoke` targeting a window name
- renderer handlers for main requests: `@IpcHandle` within an `@IpcListener` service

For maintainability, UI components should call gateways/services instead of using `window.ipc` directly.

## Window Service API Used Here

Renderer side:

- `MainWindow extends AbstractWindowService`
- `@Window({ name: 'main' })` to bind the service to the window identity
- `@WindowCommand(...)` and `@WindowOn(...)` for seamless bidirectional commands/events

Cross-window orchestration in renderer uses `AbstractWindowControllerService`.

## Development Workflow

From the workspace root, you can also run:

```bash
npx nx build seamless-electron
npx nx lint seamless-electron
npx nx test seamless-electron
```

## Why This Example Exists

`seamless-electron` is designed to validate developer experience patterns before they are adopted in package documentation and production apps.
