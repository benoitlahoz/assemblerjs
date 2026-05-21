import { AbstractAssemblage, Assemblage, Global } from 'assemblerjs';
import { shell, type Rectangle } from 'electron';
import { join } from 'path';
import { ElectronWindow, Window, WindowCommand } from '@assemblerjs/electron';

@Window({
  name: 'main',
  width: 900,
  height: 670,
  show: false,
  autoHideMenuBar: true,
  webPreferences: {
    sandbox: false,
  },
  router: {
    file: join(__dirname, '../renderer/index.html'),
    dev: process.env['ELECTRON_RENDERER_URL'],
    route: '/',
  },
})
@Assemblage({ singleton: false })
export class MainWindow extends ElectronWindow implements AbstractAssemblage {
  constructor(@Global('preload') preload: string) {
    super({
      webPreferences: {
        preload,
      },
    });
  }

  public async onInit(): Promise<void> {
    this.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url);
      return { action: 'deny' };
    });
  }

  @WindowCommand('getBounds')
  public getBoundsCommand(): Rectangle {
    return this.getBounds();
  }
}
