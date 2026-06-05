import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { AbstractWindowController, AppOn, WindowOrchestrator } from '@assemblerjs/electron';
import { ElectronAppModule } from '@features/app/main/app.module';
import { ElectronAppEvent } from '@features/app/universal/app.events';
import { AboutWindow } from './about';
import { AboutWindowConfig } from './about/universal/window.config';
import { MainWindow } from './main';
import { MainWindowConfig } from './main/universal/window.config';

type AppWindowMap = {
  [MainWindowConfig.name]: MainWindow;
  [AboutWindowConfig.name]: AboutWindow;
};

@WindowOrchestrator()
@Assemblage({
  provide: [[MainWindow], [AboutWindow]],
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

    const mainWindow = await this.openWindow(MainWindowConfig.name);
    mainWindow.center();
    mainWindow.show();
  }

  public onDispose(): void {
    this.closeAllWindows();
  }

  @AppOn(ElectronAppEvent.Activate, true)
  private async onActivate(): Promise<void> {
    const mainWindow = await this.openWindow(MainWindowConfig.name);
    mainWindow.center();
    mainWindow.show();
  }
}
