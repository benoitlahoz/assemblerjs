import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { ElectronMenu, Menu, SubMenu } from '@assemblerjs/electron';
import { I18nService } from '@features/i18n/main';
import { AppMenu } from './app';
import { DeveloperToolsMenu } from './developer';
import { StandardWindowMenu } from './window';

const AboutMenuConfig = {
  App: { id: 'about.menu.app', order: 10 },
  Window: { id: 'about.menu.window', order: 20 },
  Developer: { id: 'about.menu.developer', order: 30 },
} as const;

@Menu({
  name: 'aboutMenu',
})
@Assemblage()
export class AboutMenu extends ElectronMenu implements AbstractAssemblage {
  constructor(
    public readonly i18n: I18nService,
    private readonly appMenu: AppMenu,
    private readonly developerToolsMenu: DeveloperToolsMenu,
    private readonly windowMenu: StandardWindowMenu,
  ) {
    super();
  }

  @SubMenu({
    id: AboutMenuConfig.App.id,
    label() {
      return this.i18n.translate('menu.group.app');
    },
    order: AboutMenuConfig.App.order,
  })
  public app(): AppMenu {
    return this.appMenu;
  }

  @SubMenu({
    id: AboutMenuConfig.Developer.id,
    label() {
      return this.i18n.translate('menu.group.developer');
    },
    order: AboutMenuConfig.Developer.order,
  })
  public developer(): DeveloperToolsMenu {
    return this.developerToolsMenu;
  }

  @SubMenu({
    id: AboutMenuConfig.Window.id,
    label() {
      return this.i18n.translate('menu.group.window');
    },
    order: AboutMenuConfig.Window.order,
  })
  public window(): StandardWindowMenu {
    return this.windowMenu;
  }
}
