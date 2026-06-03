import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { ElectronMenu, Menu, MenuItem, SubMenu } from '@assemblerjs/electron';
import { I18nService } from '@features/i18n/main';
import { DeveloperToolsMenu } from './developer-tools.menu';

@Menu({
  name: 'aboutMenu',
})
@Assemblage()
export class AboutMenu extends ElectronMenu implements AbstractAssemblage {
  constructor(public readonly i18n: I18nService) {
    super();
  }

  @MenuItem({
    id: 'about.app.quit',
    path: 'App',
    label(this: AboutMenu) {
      return this.i18n.translate('menu.app.quit');
    },
    accelerator: 'CmdOrCtrl+Q',
    role: 'quit',
    order: 10,
  })
  private quit(): void {}

  @SubMenu('Developer')
  public developer = DeveloperToolsMenu;
}
