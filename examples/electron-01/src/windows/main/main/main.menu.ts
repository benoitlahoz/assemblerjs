import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { ElectronMenu, Menu, createMenuItem } from '@assemblerjs/electron';
import { MAIN_WINDOW_CONFIG } from '../universal/window.config';

@Menu({ window: MAIN_WINDOW_CONFIG.name, name: 'mainMenu' })
@Assemblage()
export class MainMenu extends ElectronMenu implements AbstractAssemblage {
  constructor() {
    super({
      translate: (key: string) => key,
    });

    const refreshBounds = createMenuItem({
      id: 'main.window.refreshBounds',
      label: 'Refresh bounds',
      accelerator: 'CmdOrCtrl+R',
    }).forwardClickToRenderer();

    const randomBounds = createMenuItem({
      id: 'main.window.randomBounds',
      label: 'Random bounds',
      accelerator: 'CmdOrCtrl+Shift+R',
    }).forwardClickToRenderer();

    const centerWindow = createMenuItem({
      id: 'main.window.centerWindow',
      label: 'Center window',
      accelerator: 'CmdOrCtrl+Shift+C',
    }).forwardClickToRenderer();

    const autoCenter = createMenuItem({
      id: 'main.menu.autoCenter',
      label: 'Auto-center after random',
      type: 'checkbox',
      checked: false,
    })
      .handleInMain((itemId, windowName) => {
        console.log(`[menu][main] clicked '${itemId}' for window '${windowName}'`);
      })
      .forwardClickToRenderer();

    const windowRoot = createMenuItem({
      id: 'menu.window',
      label: 'Window',
    });
    windowRoot.submenu = [refreshBounds, randomBounds, centerWindow, autoCenter];

    const quit = createMenuItem({
      id: 'app.quit',
      label: 'Quit',
      accelerator: 'CmdOrCtrl+Q',
      role: 'quit',
    });

    const appRoot = createMenuItem({
      id: 'menu.app',
      label: 'App',
    });
    appRoot.submenu = [quit];

    this.registerItem(appRoot);
    this.registerItem(windowRoot);
  }
}
