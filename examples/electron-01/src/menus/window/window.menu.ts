import { Assemblage } from 'assemblerjs';
import { MenuItem } from '@assemblerjs/electron';
import { I18nService } from '@features/i18n/main';

@MenuItem('Window')
@Assemblage()
export class WindowMenu {
  constructor(public readonly i18n: I18nService) {}

  @MenuItem({
    id: 'main.window.refreshBounds',
    label(this: WindowMenu) {
      return this.i18n.translate('menu.window.refreshBounds');
    },
    accelerator: 'CmdOrCtrl+D',
    order: 10,
    forwardToRenderer: true,
  })
  private refreshBounds(): void {}

  @MenuItem({
    id: 'main.window.randomBounds',
    label(this: WindowMenu) {
      return this.i18n.translate('menu.window.randomBounds');
    },
    accelerator: 'CmdOrCtrl+Shift+D',
    order: 20,
    forwardToRenderer: true,
  })
  private randomBounds(): void {}

  @MenuItem({
    id: 'main.window.centerWindow',
    label(this: WindowMenu) {
      return this.i18n.translate('menu.window.centerWindow');
    },
    accelerator: 'CmdOrCtrl+Shift+C',
    order: 30,
    forwardToRenderer: true,
  })
  private centerWindow(): void {}

  @MenuItem({
    id: 'main.menu.autoCenter',
    label(this: WindowMenu) {
      return this.i18n.translate('menu.window.autoCenter');
    },
    type: 'checkbox',
    checked: false,
    order: 40,
    handleInMain: true,
    forwardToRenderer: true,
  })
  private autoCenter(itemId: string, windowName: string): void {
    console.log(`[menu][window] clicked '${itemId}' for window '${windowName}'`);
  }
}
