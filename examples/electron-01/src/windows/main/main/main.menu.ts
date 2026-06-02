import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { ElectronMenu, Menu, MenuItem, buildMenuTreeFromMetadata } from '@assemblerjs/electron';
import { MAIN_WINDOW_CONFIG } from '../universal/window.config';

@Menu({ window: MAIN_WINDOW_CONFIG.name, name: 'mainMenu' })
@Assemblage()
export class MainMenu extends ElectronMenu implements AbstractAssemblage {
  constructor() {
    super({
      translate: (key: string) => key,
    });

    const { roots, itemsById } = buildMenuTreeFromMetadata(this.constructor);

    itemsById.get('main.window.refreshBounds')?.forwardClickToRenderer();
    itemsById.get('main.window.randomBounds')?.forwardClickToRenderer();
    itemsById.get('main.window.centerWindow')?.forwardClickToRenderer();
    itemsById
      .get('main.menu.autoCenter')
      ?.handleInMain((itemId, windowName) => {
        console.log(`[menu][main] clicked '${itemId}' for window '${windowName}'`);
      })
      .forwardClickToRenderer();

    for (const root of roots) {
      this.registerItem(root);
    }
  }

  // Step 1 integration: declarative metadata only (runtime builder still imperative).
  @MenuItem({
    id: 'main.window.refreshBounds',
    path: 'Window',
    label: 'Refresh bounds',
    accelerator: 'CmdOrCtrl+R',
    order: 10,
  })
  private declareRefreshBounds(): void {}

  @MenuItem({
    id: 'main.window.randomBounds',
    path: 'Window',
    label: 'Random bounds',
    accelerator: 'CmdOrCtrl+Shift+R',
    order: 20,
  })
  private declareRandomBounds(): void {}

  @MenuItem({
    id: 'main.window.centerWindow',
    path: 'Window',
    label: 'Center window',
    accelerator: 'CmdOrCtrl+Shift+C',
    order: 30,
  })
  private declareCenterWindow(): void {}

  @MenuItem({
    id: 'main.menu.autoCenter',
    path: 'Window',
    label: 'Auto-center after random',
    type: 'checkbox',
    checked: false,
    order: 40,
  })
  private declareAutoCenter(): void {}

  @MenuItem({
    id: 'app.quit',
    path: 'App',
    label: 'Quit',
    accelerator: 'CmdOrCtrl+Q',
    role: 'quit',
    order: 10,
  })
  private declareQuit(): void {}
}
