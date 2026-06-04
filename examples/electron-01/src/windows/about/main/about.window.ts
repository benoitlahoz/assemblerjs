import { AbstractAssemblage, Assemblage, Global } from 'assemblerjs';
import { join } from 'path';
import { ElectronWindow, UseMenu, Window } from '@assemblerjs/electron';
import { AppMenu } from '@menus/app';
import { EditMenu } from '@menus/edit';
import { WindowMenu } from '@menus/window';
import { WindowBoundsMenuConfig } from '@menus/window/window-bounds.menu';
import { DeveloperToolsMenu } from '@menus/developer';
import { ABOUT_WINDOW_CONFIG } from '../universal/window.config';

@Window({
  name: ABOUT_WINDOW_CONFIG.name,
  width: 480,
  height: 480,
  show: false,
  maximizable: false,
  minimizable: false,
  resizable: false,
  autoHideMenuBar: true,
  webPreferences: {
    sandbox: false,
  },
  router: {
    file: join(__dirname, '../renderer/index.html'),
    dev: process.env['ELECTRON_RENDERER_URL'],
    route: ABOUT_WINDOW_CONFIG.route,
  },
})
@UseMenu([
  AppMenu,
  EditMenu,
  [
    WindowMenu,
    {
      items: {
        // Test disabling items without system roles
        [WindowBoundsMenuConfig.RefreshBounds.id]: { enabled: false },
        [WindowBoundsMenuConfig.RandomBounds.id]: { enabled: false },
        // Completely hide CenterWindow
        [WindowBoundsMenuConfig.CenterWindow.id]: { visible: false },
      },
    },
  ],
  DeveloperToolsMenu,
])
@Assemblage()
export class AboutWindow extends ElectronWindow implements AbstractAssemblage {
  constructor(@Global('preload') preload: string) {
    super({
      webPreferences: {
        preload,
      },
    });
  }

  public async onInit(): Promise<void> {
    this.setMenuBarVisibility(false);
  }
}
