import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { AbstractWindowController, AppOn, WindowOrchestrator } from '@assemblerjs/electron';
import { ElectronAppModule } from '@features/app/main/app.module';
import { ElectronAppEvent } from '@features/app/universal/app.events';
import { MainMenu, MainWindow } from './main';
import { MAIN_WINDOW_CONFIG } from './universal/window.config';

type AppWindowMap = {
  [MAIN_WINDOW_CONFIG.name]: MainWindow;
};

@WindowOrchestrator()
@Assemblage({
  // Centralize all window definitions here as the app grows.
  provide: [[MainWindow], [MainMenu]],
})
export class WindowControllerService
  extends AbstractWindowController<AppWindowMap>
  implements AbstractAssemblage
{
  constructor(public electron: ElectronAppModule) {
    super();
  }

  public async onInit(): Promise<void> {
    await this.electron.whenReady();

    const mainWindow = await this.openWindow(MAIN_WINDOW_CONFIG.name);
    mainWindow.center();
    mainWindow.show();
  }

  public onDispose(): void {
    this.closeAllWindows();
  }

  @AppOn(ElectronAppEvent.Activate, true)
  private async onActivate(): Promise<void> {
    const mainWindow = await this.openWindow(MAIN_WINDOW_CONFIG.name);
    mainWindow.center();
    mainWindow.show();
  }
}
