import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import {
  ForwardClickToRenderer,
  HandleInMain,
  MenuFragment,
  MenuItem,
} from '@assemblerjs/electron';
import { I18nService } from '@features/i18n/main';

@MenuFragment({ path: 'Window' })
@Assemblage()
export class MainWindowMenuFragment implements AbstractAssemblage {
  constructor(private readonly i18n: I18nService) {}

  @MenuItem({
    id: 'main.window.refreshBounds',
    label(this: MainWindowMenuFragment) {
      return this.i18n.translate('menu.window.refreshBounds');
    },
    accelerator: 'CmdOrCtrl+R',
    order: 10,
  })
  @ForwardClickToRenderer()
  private refreshBounds(): void {}

  @MenuItem({
    id: 'main.window.randomBounds',
    label(this: MainWindowMenuFragment) {
      return this.i18n.translate('menu.window.randomBounds');
    },
    accelerator: 'CmdOrCtrl+Shift+R',
    order: 20,
  })
  @ForwardClickToRenderer()
  private randomBounds(): void {}

  @MenuItem({
    id: 'main.window.centerWindow',
    label(this: MainWindowMenuFragment) {
      return this.i18n.translate('menu.window.centerWindow');
    },
    accelerator: 'CmdOrCtrl+Shift+C',
    order: 30,
  })
  @ForwardClickToRenderer()
  private centerWindow(): void {}

  @MenuItem({
    id: 'main.menu.autoCenter',
    label(this: MainWindowMenuFragment) {
      return this.i18n.translate('menu.window.autoCenter');
    },
    type: 'checkbox',
    checked: false,
    order: 40,
  })
  @HandleInMain()
  @ForwardClickToRenderer()
  private autoCenter(itemId: string, windowName: string): void {
    console.log(`[menu][main] clicked '${itemId}' for window '${windowName}'`);
  }
}
