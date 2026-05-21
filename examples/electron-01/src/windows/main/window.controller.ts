import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { AppListener, AppOn, WindowController } from '@assemblerjs/electron';
import { WindowControllerSupport } from '@assemblerjs/electron';
import { ElectronAppModule } from '@features/app/main/app.module';
import { ElectronAppEvent } from '@features/app/universal/app.events';
import { MainWindow } from './main';

@AppListener()
@WindowController()
@Assemblage({
  // Centralize all window definitions here as the app grows.
  provide: [[MainWindow]],
})
export class WindowControllerService extends WindowControllerSupport implements AbstractAssemblage {
  constructor(public electron: ElectronAppModule) {
    super();
  }

  public async onInit(): Promise<void> {
    await this.electron.whenReady();

    const mainWindow = await this.openWindow('main');
    mainWindow.center();
    mainWindow.show();
  }

  public onDispose(): void {
    this.closeAllWindows();
  }

  @AppOn(ElectronAppEvent.Activate, true)
  private async onActivate(): Promise<void> {
    if (!this.hasWindow('main')) {
      const mainWindow = await this.openWindow('main');
      mainWindow.center();
      mainWindow.show();
    }
  }
}
