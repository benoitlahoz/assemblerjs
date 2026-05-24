# electron-01

AssemblerJS Electron example showcasing:

- typed preload IPC bridge setup
- renderer -> main IPC (`@IpcSend`, `@IpcInvoke`)
- main -> renderer symmetric RPC (`@IpcInvoke` in main, `@IpcHandle` in renderer)
- window command/event patterns used by the window services
- renderer window service pattern with `@Window` + `AbstractWindowService`
- global window orchestration with `AbstractWindowControllerService`

This example is part of the AssemblerJS monorepo and is intended as a practical reference for package consumers.

## Tech Stack

- Electron
- Vue 3
- TypeScript
- AssemblerJS
- @assemblerjs/electron

## Project Structure

- `src/preload`: preload bridge and IPC channel contracts
- `src/features/ipc/main`: main-side IPC listeners/handlers
- `src/features/ipc/renderer`: renderer-side gateways and handlers
- `src/windows/main/renderer`: Vue UI using service/gateway abstractions
- `src/windows/main/renderer/main.window.ts`: scoped renderer window service (`MainWindow`)
- `src/windows/main/window.controller.ts`: main-side window controller module

## Getting Started

From the repository root:

```bash
yarn install
```

Run the example in development mode:

```bash
yarn workspace electron-01 dev
```

## Scripts

From `examples/electron-01`:

```bash
yarn dev
yarn typecheck
yarn lint
yarn build
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

- renderer -> main: `@IpcSend`, `@IpcInvoke`, `@IpcHandle` (for main-to-renderer requests)
- main -> renderer: `@IpcInvoke` targeting a window name

For maintainability, UI components should call gateways/services instead of using `window.ipc` directly.

## Window Service API Used Here

Renderer side:

- `MainWindow extends AbstractWindowService`
- `@Window({ name: 'main' })` to bind the service to the window identity
- `@WindowCommand(...)` and `@WindowOn(...)` for full-duplex commands/events

Cross-window orchestration in renderer uses `AbstractWindowControllerService`.

## Why This Example Exists

`electron-01` is designed to validate developer experience patterns before they are adopted in package documentation and production apps.
