import { AbstractAssemblage, Assemblage, Context, type AssemblerContext } from 'assemblerjs';
import {
  AbstractWindowController,
  ElectronMenu,
  Menu,
  MenuItem,
  SubMenu,
} from '@assemblerjs/electron';
import { I18nService } from '@features/i18n/main';
import { ABOUT_WINDOW_CONFIG } from '@windows/about/universal/window.config';
import { DeveloperToolsMenu } from './developer-tools.menu';

@Menu({
  name: 'mainMenu',
})
@Assemblage()
export class MainMenu extends ElectronMenu implements AbstractAssemblage {
  constructor(
    public readonly i18n: I18nService,
    public readonly windowsController: AbstractWindowController,
    @Context() private readonly context: AssemblerContext,
  ) {
    super();
  }

  @MenuItem({
    id: 'app.about',
    path: 'App',
    label(this: MainMenu) {
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
    path: 'App',
    label(this: MainMenu) {
      return this.i18n.translate('menu.app.quit');
    },
    accelerator: 'CmdOrCtrl+Q',
    role: 'quit',
    order: 10,
  })
  private quit(): void {}

  @MenuItem({
    id: 'main.window.refreshBounds',
    path: 'Window',
    label(this: MainMenu) {
      return this.i18n.translate('menu.window.refreshBounds');
    },
    accelerator: 'CmdOrCtrl+D',
    order: 10,
    forwardToRenderer: true,
  })
  private refreshBounds(): void {}

  @MenuItem({
    id: 'main.window.randomBounds',
    path: 'Window',
    label(this: MainMenu) {
      return this.i18n.translate('menu.window.randomBounds');
    },
    accelerator: 'CmdOrCtrl+Shift+D',
    order: 20,
    forwardToRenderer: true,
  })
  private randomBounds(): void {}

  @MenuItem({
    id: 'main.window.centerWindow',
    path: 'Window',
    label(this: MainMenu) {
      return this.i18n.translate('menu.window.centerWindow');
    },
    accelerator: 'CmdOrCtrl+Shift+C',
    order: 30,
    forwardToRenderer: true,
  })
  private centerWindow(): void {}

  @MenuItem({
    id: 'main.menu.autoCenter',
    path: 'Window',
    label(this: MainMenu) {
      return this.i18n.translate('menu.window.autoCenter');
    },
    type: 'checkbox',
    checked: false,
    order: 40,
    handleInMain: true,
    forwardToRenderer: true,
  })
  private autoCenter(itemId: string, windowName: string): void {
    console.log(`[menu][main] clicked '${itemId}' for window '${windowName}'`);
  }

  @SubMenu('Developer')
  public developer = DeveloperToolsMenu;
}
