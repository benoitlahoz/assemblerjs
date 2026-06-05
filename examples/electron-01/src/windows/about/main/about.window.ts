import { AbstractAssemblage, Assemblage, Global } from 'assemblerjs';

import { ElectronWindow, UseMenu, Window } from '@assemblerjs/electron';
import { AppMenu } from '@menus/app';
import { EditMenu } from '@menus/edit';
import { WindowMenu } from '@menus/window';
import { WindowBoundsMenuConfig } from '@menus/window/window-bounds.menu';
import { DeveloperToolsMenu } from '@menus/developer';
import { AboutWindowConfig } from '../universal/window.config';
import type { WindowEnv } from '../../window.env';

@Window({
  name: AboutWindowConfig.name,
  width: AboutWindowConfig.width,
  height: AboutWindowConfig.height,
  show: AboutWindowConfig.show,
  maximizable: AboutWindowConfig.maximizable,
  minimizable: AboutWindowConfig.minimizable,
  resizable: AboutWindowConfig.resizable,
  autoHideMenuBar: AboutWindowConfig.autoHideMenuBar,
  webPreferences: {
    sandbox: AboutWindowConfig.webPreferences.sandbox,
  },
  router: {
    route: AboutWindowConfig.route,
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
  constructor(@Global('env') env: WindowEnv) {
    super({
      webPreferences: {
        preload: env.preload,
      },
      router: {
        file: env.file,
        dev: env.dev,
      },
    });
  }

  public async onInit(): Promise<void> {
    this.setMenuBarVisibility(false);
  }
}
