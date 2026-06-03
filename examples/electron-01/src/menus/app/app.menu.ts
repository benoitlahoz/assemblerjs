import { Assemblage } from 'assemblerjs';
import { AbstractWindowController, MenuItem } from '@assemblerjs/electron';
import { I18nService } from '@features/i18n/main';
import { ABOUT_WINDOW_CONFIG } from '@windows/about/universal/window.config';

@Assemblage()
export class AppMenu {
  constructor(
    public readonly i18n: I18nService,
    public readonly windowsController: AbstractWindowController,
  ) {}

  @MenuItem({
    id: 'app.about',
    label(this: AppMenu) {
      return this.i18n.translate('menu.app.about');
    },
    order: 5,
    handleInMain: true,
  })
  private async openAboutWindow(): Promise<void> {
    const aboutWindow = await this.windowsController.openWindow(ABOUT_WINDOW_CONFIG.name);
    aboutWindow.center();
    aboutWindow.show();
    aboutWindow.focus();
  }

  @MenuItem({
    id: 'app.quit',
    label(this: AppMenu) {
      return this.i18n.translate('menu.app.quit');
    },
    accelerator: 'CmdOrCtrl+Q',
    role: 'quit',
    order: 10,
  })
  private quit(): void {}
}
