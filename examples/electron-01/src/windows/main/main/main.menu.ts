import { AbstractAssemblage, Assemblage, Context, type AssemblerContext } from 'assemblerjs';
import {
  ElectronMenu,
  ForwardClickToRenderer,
  HandleInMain,
  Menu,
  MenuItem,
} from '@assemblerjs/electron';
import { I18nService } from '@features/i18n/main';
import { WindowControllerService } from '@windows/window.controller';
import { ABOUT_WINDOW_CONFIG } from '@windows/about/universal/window.config';

@Menu({
  name: 'mainMenu',
})
@Assemblage()
export class MainMenu extends ElectronMenu implements AbstractAssemblage {
  constructor(
    public readonly i18n: I18nService,
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
  })
  @HandleInMain()
  private async openAboutWindow(): Promise<void> {
    const windows = this.context.require(WindowControllerService);
    const aboutWindow = await windows.openWindow(ABOUT_WINDOW_CONFIG.name);
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
  })
  @ForwardClickToRenderer()
  private refreshBounds(): void {}

  @MenuItem({
    id: 'main.window.randomBounds',
    path: 'Window',
    label(this: MainMenu) {
      return this.i18n.translate('menu.window.randomBounds');
    },
    accelerator: 'CmdOrCtrl+Shift+D',
    order: 20,
  })
  @ForwardClickToRenderer()
  private randomBounds(): void {}

  @MenuItem({
    id: 'main.window.centerWindow',
    path: 'Window',
    label(this: MainMenu) {
      return this.i18n.translate('menu.window.centerWindow');
    },
    accelerator: 'CmdOrCtrl+Shift+C',
    order: 30,
  })
  @ForwardClickToRenderer()
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
  })
  @HandleInMain()
  @ForwardClickToRenderer()
  private autoCenter(itemId: string, windowName: string): void {
    console.log(`[menu][main] clicked '${itemId}' for window '${windowName}'`);
  }

  @MenuItem({
    id: 'main.developer.reload',
    path: 'Developer/Refresh',
    role: 'reload',
    order: 10,
  })
  private reload(): void {}

  @MenuItem({
    id: 'main.developer.forceReload',
    path: 'Developer/Refresh',
    role: 'forceReload',
    order: 20,
  })
  private forceReload(): void {}

  @MenuItem({
    id: 'main.developer.toggleDevTools',
    path: 'Developer',
    role: 'toggleDevTools',
    order: 30,
  })
  private toggleDevTools(): void {}
}
