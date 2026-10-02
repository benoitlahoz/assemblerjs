# Window Architecture

This guide focuses on window lifecycle and command patterns.

## Main-Side Window Definition

A real BrowserWindow is represented by a class extending `ElectronWindow`.

```typescript
import { AbstractAssemblage, Assemblage, Global } from 'assemblerjs';
import { ElectronWindow, Window, WindowOn } from '@assemblerjs/electron';

@Window({ name: 'main', width: 1280, height: 900, show: false })
@Assemblage({ singleton: false })
class MainWindow extends ElectronWindow implements AbstractAssemblage {
  constructor(@Global('preload') preload: string) {
    super({ webPreferences: { preload } });
  }

  @WindowOn('ready-to-show')
  onReadyToShow() {
    this.show();
  }
}
```

## Renderer-Side Window Service

Use one renderer service per window identity.

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
  @WindowCommand()
  async getBounds() {
    return await this.windows.getBounds('main');
  }

  @WindowCommand('refresh-bounds')
  async refreshBounds() {
    return await this.getBounds();
  }
}
```

## Controller vs Scoped Service

- `AbstractWindowControllerService`: cross-window operations from renderer.
- `AbstractWindowService`: one-window service with local ownership.

Use the controller for global operations (open/close/focus another window), and scoped service for local window logic.

## Reliability Note

When opening windows, avoid duplicate startup opens caused by racing calls.

Recommended practice:

- keep one pending-open promise per window name
- reuse that promise while creation is in flight
- clear pending state only after success/failure resolution

This avoids duplicate windows under concurrent bootstrap/event paths.
