import { Assemblage } from 'assemblerjs';
import { MenuItem } from '@assemblerjs/electron';
import { I18nService } from '@features/i18n/main';

export const WindowCustomMenuConfig = {
  RefreshBounds: { id: 'window.custom.refreshBounds', order: 10 },
  RandomBounds: { id: 'window.custom.randomBounds', order: 20 },
  CenterWindow: { id: 'window.custom.centerWindow', order: 30 },
  AutoCenter: { id: 'window.custom.autoCenter', order: 40 },
} as const;

@MenuItem('Bounds')
@Assemblage()
export class WindowCustomMenu {
  constructor(public readonly i18n: I18nService) {}

  @MenuItem({
    id: WindowCustomMenuConfig.RefreshBounds.id,
    label(this: WindowCustomMenu) {
      return this.i18n.translate('menu.window.refreshBounds');
    },
    accelerator: 'CmdOrCtrl+D',
    order: WindowCustomMenuConfig.RefreshBounds.order,
    forwardToRenderer: true,
  })
  private refreshBounds(): void {}

  @MenuItem({
    id: WindowCustomMenuConfig.RandomBounds.id,
    label(this: WindowCustomMenu) {
      return this.i18n.translate('menu.window.randomBounds');
    },
    accelerator: 'CmdOrCtrl+Shift+D',
    order: WindowCustomMenuConfig.RandomBounds.order,
    forwardToRenderer: true,
  })
  private randomBounds(): void {}

  @MenuItem({
    id: WindowCustomMenuConfig.CenterWindow.id,
    label(this: WindowCustomMenu) {
      return this.i18n.translate('menu.window.centerWindow');
    },
    accelerator: 'CmdOrCtrl+Shift+C',
    order: WindowCustomMenuConfig.CenterWindow.order,
    forwardToRenderer: true,
  })
  private centerWindow(): void {}

  @MenuItem({
    id: WindowCustomMenuConfig.AutoCenter.id,
    label(this: WindowCustomMenu) {
      return this.i18n.translate('menu.window.autoCenter');
    },
    type: 'checkbox',
    checked: false,
    order: WindowCustomMenuConfig.AutoCenter.order,
    handleInMain: true,
    forwardToRenderer: true,
  })
  private autoCenter(itemId: string, windowName: string): void {
    console.log(`[menu][window] clicked '${itemId}' for window '${windowName}'`);
  }
}
