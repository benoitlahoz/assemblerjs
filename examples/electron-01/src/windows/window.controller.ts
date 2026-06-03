import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import {
  AbstractMenuRegistryService,
  AbstractWindowController,
  AbstractWindowMenuBindingRegistryService,
  AppOn,
  MenuRegistryService,
  WindowMenuBindingRegistryService,
  WindowOrchestrator,
} from '@assemblerjs/electron';
import { ElectronAppModule } from '@features/app/main/app.module';
import { ElectronAppEvent } from '@features/app/universal/app.events';
import { AboutMenu, AboutWindow } from './about';
import { ABOUT_WINDOW_CONFIG } from './about/universal/window.config';
import { MainMenu, MainWindow } from './main';
import { MAIN_WINDOW_CONFIG } from './main/universal/window.config';

type AppWindowMap = {
  [MAIN_WINDOW_CONFIG.name]: MainWindow;
  [ABOUT_WINDOW_CONFIG.name]: AboutWindow;
};

@WindowOrchestrator()
@Assemblage({
  provide: [
    [MainWindow],
    [AboutWindow],
    [MainMenu],
    [AboutMenu],
    [AbstractMenuRegistryService, MenuRegistryService],
    [AbstractWindowMenuBindingRegistryService, WindowMenuBindingRegistryService],
  ],
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
