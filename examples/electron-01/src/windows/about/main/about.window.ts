import { AbstractAssemblage, Assemblage, Global } from 'assemblerjs';
import { join } from 'path';
import { ElectronWindow, UseMenu, Window } from '@assemblerjs/electron';
import { AppMenu } from '@menus/app';
import { WindowMenu, WindowMenuConfig } from '@menus/window';
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
  [
    WindowMenu,
    {
      items: {
        [WindowMenuConfig.SepCustom.id]: { visible: false },
        [WindowMenuConfig.RefreshBounds.id]: { visible: false },
        [WindowMenuConfig.RandomBounds.id]: { visible: false },
        [WindowMenuConfig.CenterWindow.id]: { visible: false },
        [WindowMenuConfig.AutoCenter.id]: { visible: false },
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
