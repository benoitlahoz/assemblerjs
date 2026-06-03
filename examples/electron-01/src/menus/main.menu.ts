import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { ElectronMenu, Menu, SubMenu } from '@assemblerjs/electron';
import { I18nService } from '@features/i18n/main';
import { AppMenu } from './app';
import { DeveloperToolsMenu } from './developer';
import { WindowMenu } from './window';

@Menu({
  name: 'mainMenu',
})
@Assemblage()
export class MainMenu extends ElectronMenu implements AbstractAssemblage {
  constructor(
    public readonly i18n: I18nService,
    private readonly appMenu: AppMenu,
    private readonly developerToolsMenu: DeveloperToolsMenu,
    private readonly windowMenu: WindowMenu,
  ) {
    super();
  }

  @SubMenu({
    id: 'main.menu.app',
    label() {
      return this.i18n.translate('menu.group.app');
    },
    order: 10,
  })
  public app(): AppMenu {
    return this.appMenu;
  }

  @SubMenu({
    id: 'main.menu.developer',
    label() {
      return this.i18n.translate('menu.group.developer');
    },
    order: 30,
  })
  public developer(): DeveloperToolsMenu {
    return this.developerToolsMenu;
  }

  @SubMenu({
    id: 'main.menu.window',
    label() {
      return this.i18n.translate('menu.group.window');
    },
    order: 20,
  })
  public window(): WindowMenu {
    return this.windowMenu;
  }
}
