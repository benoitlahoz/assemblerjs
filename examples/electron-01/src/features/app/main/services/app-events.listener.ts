import { app } from 'electron';
import { AbstractAssemblage, Assemblage, Dispose } from 'assemblerjs';
import { AppListener, AppOn } from '@assemblerjs/electron';
import { optimizer } from '@electron-toolkit/utils';

enum ElectronAppEvent {
  Activate = 'activate',
  WillQuit = 'will-quit',
  WindowCreated = 'browser-window-created',
  WindowAllClosed = 'window-all-closed',
}

@AppListener()
@Assemblage()
export class AppEventsListener implements AbstractAssemblage {
  constructor(@Dispose() public dispose: () => void) {}

  @AppOn(ElectronAppEvent.WindowCreated, true)
  public onBrowserWindowCreated(_, window): void {
    // TODO: We want to get rid of this dependency to electron-toolkit/utils and implement our own solution for devtools and reload shortcuts
    optimizer.watchWindowShortcuts(window);
  }

  @AppOn(ElectronAppEvent.Activate, true)
  public onActivate(): void {
    // TODO: Recreate main window if all windows are closed (macOS)
  }

  @AppOn(ElectronAppEvent.WindowAllClosed)
  protected onClose(): void {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  @AppOn(ElectronAppEvent.WillQuit)
  protected onWillQuit(): void {
    // Use with caution as it will dispose all the services and listeners registered in MainApp
    this.dispose();
  }
}
