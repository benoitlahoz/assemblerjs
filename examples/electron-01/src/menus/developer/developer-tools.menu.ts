import { Assemblage } from 'assemblerjs';
import { MenuItem, SubMenu } from '@assemblerjs/electron';
import { I18nService } from '@features/i18n/main';

@MenuItem('Reload')
@Assemblage()
class DeveloperRefreshMenu {
  @MenuItem({
    id: 'developer.reload',
    role: 'reload',
    order: 10,
  })
  private reload(): void {}

  @MenuItem({
    id: 'developer.forceReload',
    role: 'forceReload',
    order: 20,
  })
  private forceReload(): void {}
}

@MenuItem('Developer')
@Assemblage({
  provide: [[DeveloperRefreshMenu]],
})
export class DeveloperToolsMenu {
  constructor(
    protected i18n: I18nService,
    public readonly reload: DeveloperRefreshMenu,
  ) {}

  @SubMenu({
    id: 'developer.reload',
    label() {
      return this.i18n.translate('menu.group.reload');
    },
    order: 10,
  })
  public reloadMenu(): DeveloperRefreshMenu {
    return this.reload;
  }

  @MenuItem({
    id: 'developer.toggleDevTools',
    label() {
      return this.i18n.translate('menu.developer.toggleDevTools');
    },
    role: 'toggleDevTools',
    order: 30,
  })
  private toggleDevTools(): void {}
}
