import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { ElectronMenu, Menu, MenuItem } from '@assemblerjs/electron';
import { I18nService } from '@features/i18n/main';

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

  @MenuItem({
    id: 'about.developer.reload',
    path: 'Developer/Refresh',
    role: 'reload',
    order: 10,
  })
  private reload(): void {}

  @MenuItem({
    id: 'about.developer.forceReload',
    path: 'Developer/Refresh',
    role: 'forceReload',
    order: 20,
  })
  private forceReload(): void {}

  @MenuItem({
    id: 'about.developer.toggleDevTools',
    path: 'Developer',
    role: 'toggleDevTools',
    order: 30,
  })
  private toggleDevTools(): void {}
}
