import { Assemblage } from 'assemblerjs';
import { MenuItem } from '@assemblerjs/electron';
import { I18nService } from '@features/i18n/main';

export const WindowBoundsMenuConfig = {
  RefreshBounds: { id: 'window.bounds.refreshBounds', order: 10 },
  RandomBounds: { id: 'window.bounds.randomBounds', order: 20 },
  CenterWindow: { id: 'window.bounds.centerWindow', order: 30 },
  AutoCenter: { id: 'window.bounds.autoCenter', order: 40 },
} as const;

@MenuItem('Bounds')
@Assemblage()
export class WindowBoundsMenu {
  constructor(public readonly i18n: I18nService) {}

  @MenuItem({
    id: WindowBoundsMenuConfig.RefreshBounds.id,
    label(this: WindowBoundsMenu) {
      return this.i18n.translate('menu.window.refreshBounds');
    },
    accelerator: 'CmdOrCtrl+D',
    order: WindowBoundsMenuConfig.RefreshBounds.order,
    forwardToRenderer: true,
  })
  private refreshBounds(): void {}

  @MenuItem({
    id: WindowBoundsMenuConfig.RandomBounds.id,
    label(this: WindowBoundsMenu) {
      return this.i18n.translate('menu.window.randomBounds');
    },
    accelerator: 'CmdOrCtrl+Shift+D',
    order: WindowBoundsMenuConfig.RandomBounds.order,
    forwardToRenderer: true,
  })
  private randomBounds(): void {}

  @MenuItem({
    id: WindowBoundsMenuConfig.CenterWindow.id,
    label(this: WindowBoundsMenu) {
      return this.i18n.translate('menu.window.centerWindow');
    },
    accelerator: 'CmdOrCtrl+Shift+C',
    order: WindowBoundsMenuConfig.CenterWindow.order,
    forwardToRenderer: true,
  })
  private centerWindow(): void {}

  @MenuItem({
    id: WindowBoundsMenuConfig.AutoCenter.id,
    label(this: WindowBoundsMenu) {
      return this.i18n.translate('menu.window.autoCenter');
    },
    type: 'checkbox',
    checked: false,
    order: WindowBoundsMenuConfig.AutoCenter.order,
    handleInMain: true,
    forwardToRenderer: true,
  })
  private autoCenter(_itemId: string, _windowName: string): void {
    // Auto-center handled via subscription in renderer
  }
}
