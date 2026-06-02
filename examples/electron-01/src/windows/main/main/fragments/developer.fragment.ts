import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { MenuFragment, MenuItem } from '@assemblerjs/electron';

@MenuFragment({ path: 'Developer/Refresh' })
@Assemblage()
export class MainDeveloperRefreshMenuFragment implements AbstractAssemblage {
  @MenuItem({
    id: 'main.developer.reload',
    role: 'reload',
    order: 10,
  })
  private reload(): void {}

  @MenuItem({
    id: 'main.developer.forceReload',
    role: 'forceReload',
    order: 20,
  })
  private forceReload(): void {}
}

@MenuFragment({ path: 'Developer' })
@Assemblage()
export class MainDeveloperMenuFragment implements AbstractAssemblage {
  @MenuItem({
    id: 'main.developer.toggleDevTools',
    role: 'toggleDevTools',
    order: 30,
  })
  private toggleDevTools(): void {}
}
