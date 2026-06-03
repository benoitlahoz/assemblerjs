import { AbstractAssemblage, Assemblage, Global } from 'assemblerjs';
import { join } from 'path';
import { ElectronWindow, UseMenu, Window } from '@assemblerjs/electron';
import { ABOUT_WINDOW_CONFIG } from '../universal/window.config';
import { AboutMenu } from './about.menu';

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
@UseMenu(AboutMenu)
@Assemblage({ singleton: false })
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
