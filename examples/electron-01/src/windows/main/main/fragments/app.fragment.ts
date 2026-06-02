import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { MenuFragment, MenuItem } from '@assemblerjs/electron';
import { I18nService } from '@features/i18n/main';

@MenuFragment({ path: 'App' })
@Assemblage()
export class MainAppMenuFragment implements AbstractAssemblage {
  constructor(private readonly i18n: I18nService) {}

  @MenuItem({
    id: 'app.quit',
    label(this: MainAppMenuFragment) {
      return this.i18n.translate('menu.app.quit');
    },
    accelerator: 'CmdOrCtrl+Q',
    role: 'quit',
    order: 10,
  })
  private quit(): void {}
}
