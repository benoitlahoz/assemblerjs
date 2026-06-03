import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { ElectronMenu, Menu, SubMenu } from '@assemblerjs/electron';
import { I18nService } from '@features/i18n/main';
import { AppMenu } from './app';
import { DeveloperToolsMenu } from './developer';
import { MainWindowMenu } from './window';

const MainMenuConfig = {
  App: { id: 'main.menu.app', order: 10 },
  Window: { id: 'main.menu.window', order: 20 },
  Developer: { id: 'main.menu.developer', order: 30 },
} as const;

@Menu({
  name: 'mainMenu',
})
@Assemblage()
export class MainMenu extends ElectronMenu implements AbstractAssemblage {
  constructor(
    public readonly i18n: I18nService,
    private readonly appMenu: AppMenu,
    private readonly developerToolsMenu: DeveloperToolsMenu,
    private readonly windowMenu: MainWindowMenu,
  ) {
    super();
  }

  @SubMenu({
    id: MainMenuConfig.App.id,
    label() {
      return this.i18n.translate('menu.group.app');
    },
    order: MainMenuConfig.App.order,
  })
  public app(): AppMenu {
    return this.appMenu;
  }

  @SubMenu({
    id: MainMenuConfig.Developer.id,
    label() {
      return this.i18n.translate('menu.group.developer');
    },
    order: MainMenuConfig.Developer.order,
  })
  public developer(): DeveloperToolsMenu {
    return this.developerToolsMenu;
  }

  @SubMenu({
    id: MainMenuConfig.Window.id,
    label() {
      return this.i18n.translate('menu.group.window');
    },
    order: MainMenuConfig.Window.order,
  })
  public window(): MainWindowMenu {
    return this.windowMenu;
  }
}
