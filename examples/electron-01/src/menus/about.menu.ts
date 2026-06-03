import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { ElectronMenu, Menu, SubMenu } from '@assemblerjs/electron';
import { I18nService } from '@features/i18n/main';
import { AppMenu } from './app';
import { DeveloperToolsMenu } from './developer';

@Menu({
  name: 'aboutMenu',
})
@Assemblage()
export class AboutMenu extends ElectronMenu implements AbstractAssemblage {
  constructor(
    public readonly i18n: I18nService,
    private readonly appMenu: AppMenu,
    private readonly developerToolsMenu: DeveloperToolsMenu,
  ) {
    super();
  }

  @SubMenu({
    id: 'about.menu.app',
    label() {
      return this.i18n.translate('menu.group.app');
    },
    order: 10,
  })
  public app(): AppMenu {
    return this.appMenu;
  }

  @SubMenu({
    id: 'about.menu.developer',
    label() {
      return this.i18n.translate('menu.group.developer');
    },
    order: 20,
  })
  public developer(): DeveloperToolsMenu {
    return this.developerToolsMenu;
  }
}
