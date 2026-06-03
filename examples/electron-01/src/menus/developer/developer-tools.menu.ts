import { Assemblage } from 'assemblerjs';
import { MenuItem, SubMenu } from '@assemblerjs/electron';
import { I18nService } from '@features/i18n/main';

const DeveloperRefreshMenuConfig = {
  Reload: { id: 'developer.reload', order: 10 },
  ForceReload: { id: 'developer.forceReload', order: 20 },
} as const;

const DeveloperToolsMenuConfig = {
  ReloadSubmenu: { id: 'developer.reload', order: 10 },
  ToggleDevTools: { id: 'developer.toggleDevTools', order: 30 },
} as const;

@MenuItem('Reload')
@Assemblage()
class DeveloperRefreshMenu {
  @MenuItem({
    id: DeveloperRefreshMenuConfig.Reload.id,
    role: 'reload',
    order: DeveloperRefreshMenuConfig.Reload.order,
  })
  private reload(): void {}

  @MenuItem({
    id: DeveloperRefreshMenuConfig.ForceReload.id,
    role: 'forceReload',
    order: DeveloperRefreshMenuConfig.ForceReload.order,
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
    id: DeveloperToolsMenuConfig.ReloadSubmenu.id,
    label() {
      return this.i18n.translate('menu.group.reload');
    },
    order: DeveloperToolsMenuConfig.ReloadSubmenu.order,
  })
  public reloadMenu(): DeveloperRefreshMenu {
    return this.reload;
  }

  @MenuItem({
    id: DeveloperToolsMenuConfig.ToggleDevTools.id,
    label() {
      return this.i18n.translate('menu.developer.toggleDevTools');
    },
    role: 'toggleDevTools',
    order: DeveloperToolsMenuConfig.ToggleDevTools.order,
  })
  private toggleDevTools(): void {}
}
