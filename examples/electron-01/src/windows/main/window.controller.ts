import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { AppListener, AppOn, WindowController } from '@assemblerjs/electron';
import { WindowControllerSupport } from '@assemblerjs/electron';
import { ElectronAppModule } from '@features/app/main/app.module';
import { ElectronAppEvent } from '@features/app/universal/app.events';
import { MainWindow } from './main';
import { MAIN_WINDOW_NAME } from './universal/main.window.constants';

@AppListener()
@WindowController()
@Assemblage({
  // Centralize all window definitions here as the app grows.
  provide: [[MainWindow]],
})
export class WindowControllerService extends WindowControllerSupport implements AbstractAssemblage {
  private openingMainWindow?: Promise<MainWindow>;

  constructor(public electron: ElectronAppModule) {
    super();
  }

  private async ensureMainWindow(): Promise<MainWindow> {
    const existing = this.getWindow(MAIN_WINDOW_NAME) as MainWindow | undefined;
    if (existing && !existing.isDestroyed()) {
      return existing;
    }

    if (!this.openingMainWindow) {
      this.openingMainWindow = this.openWindow(MAIN_WINDOW_NAME).then(
        (window) => window as MainWindow,
      );
    }

    try {
      return await this.openingMainWindow;
    } finally {
      this.openingMainWindow = undefined;
    }
  }

  public async onInit(): Promise<void> {
    await this.electron.whenReady();

    const mainWindow = await this.ensureMainWindow();
    mainWindow.center();
    mainWindow.show();
  }

  public onDispose(): void {
    this.closeAllWindows();
  }

  @AppOn(ElectronAppEvent.Activate, true)
  private async onActivate(): Promise<void> {
    const mainWindow = await this.ensureMainWindow();
    mainWindow.center();
    mainWindow.show();
  }
}
