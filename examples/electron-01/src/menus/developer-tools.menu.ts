import { Assemblage } from 'assemblerjs';
import { MenuItem, SubMenu } from '@assemblerjs/electron';

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
@Assemblage()
export class DeveloperToolsMenu {
  @SubMenu('Refresh')
  public refresh = DeveloperRefreshMenu;

  @MenuItem({
    id: 'developer.toggleDevTools',
    role: 'toggleDevTools',
    order: 30,
  })
  private toggleDevTools(): void {}
}
