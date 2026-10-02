# Quick Start

This page shows a minimal architecture for a typed Electron application with AssemblerJS.

## 1. Main Bootstrap

```typescript
import 'reflect-metadata';
import { app } from 'electron';
import { join } from 'path';
import { Assemblage, Assembler, AbstractAssemblage } from 'assemblerjs';
import { WindowControllerService } from '@windows/main';

@Assemblage({
  provide: [[WindowControllerService]],
  global: {
    preload: join(__dirname, '../preload/index.js'),
  },
})
class MainApp implements AbstractAssemblage {
  constructor(public windows: WindowControllerService) {}
}

Assembler.build(MainApp).catch(() => app.quit());
```

## 2. Define a Main Window

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

## 3. Expose a Strict Preload Bridge

```typescript
import { setupIpcBridge } from '@assemblerjs/electron/preload';

setupIpcBridge({
  channels: ['app:get-versions', 'window:focus-main'],
  strict: true,
});
```

## 4. Use a Renderer Window Service

```typescript
import { Assemblage } from 'assemblerjs';
import {
  AbstractWindowService,
  Window,
  WindowCommand,
} from '@assemblerjs/electron/renderer';

@Window({ name: 'main' })
@Assemblage()
class MainWindowService extends AbstractWindowService {
  @WindowCommand('refreshBounds')
  async refreshBounds() {
    return await this.getBounds();
  }
}
```

## 5. Consume Through DI

```typescript
import { useContext } from 'assemblerjs';
import { MainWindowService } from '@windows/main/renderer';

const mainWindow = useContext().require(MainWindowService);
await mainWindow.refreshBounds();
```

## Next Step

Continue with:

- [Process Boundaries](../core-concepts/process-boundaries.md)
- [IPC Patterns](../guides/ipc-patterns.md)
- [Window Architecture](../guides/window-architecture.md)
