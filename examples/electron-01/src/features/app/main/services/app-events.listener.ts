import { app } from 'electron';
import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { AppListener, AppOn } from '@assemblerjs/electron';
import { optimizer } from '@electron-toolkit/utils';

enum ElectronAppEvent {
  BrowserWindowCreated = 'browser-window-created',
  Activate = 'activate',
  WindowAllClosed = 'window-all-closed',
}

@AppListener()
@Assemblage()
export class AppEventsListener implements AbstractAssemblage {
  constructor() {}

  @AppOn(ElectronAppEvent.BrowserWindowCreated, true)
  public onBrowserWindowCreated(_, window): void {
    // TODO: We want to get rid of this dependency to electron-toolkit/utils and implement our own solution for devtools and reload shortcuts
    optimizer.watchWindowShortcuts(window);
  }

  @AppOn(ElectronAppEvent.Activate, true)
  public onActivate(): void {
    // TODO: Recreate main window if all windows are closed (macOS)
    console.log('App activated');
  }

  @AppOn(ElectronAppEvent.WindowAllClosed)
  protected onClose(): void {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }
}
