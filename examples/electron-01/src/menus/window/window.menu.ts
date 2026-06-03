import { Assemblage } from 'assemblerjs';
import { MenuItem } from '@assemblerjs/electron';
import { I18nService } from '@features/i18n/main';

export const WindowMenuConfig = {
  Minimize: { id: 'window.minimize', order: 10 },
  Zoom: { id: 'window.zoom', order: 20 },
  Sep1: { id: 'window.sep.1', order: 30 },
  Close: { id: 'window.close', order: 40 },
  Sep2: { id: 'window.sep.2', order: 50 },
  Front: { id: 'window.front', order: 60 },
  SepCustom: { id: 'window.sep.custom', order: 70 },
  RefreshBounds: { id: 'window.refreshBounds', order: 80 },
  RandomBounds: { id: 'window.randomBounds', order: 90 },
  CenterWindow: { id: 'window.centerWindow', order: 100 },
  AutoCenter: { id: 'window.autoCenter', order: 110 },
} as const;

@MenuItem('Window')
@Assemblage()
export class WindowMenu {
  constructor(public readonly i18n: I18nService) {}

  @MenuItem({
    id: WindowMenuConfig.Minimize.id,
    role: 'minimize',
    order: WindowMenuConfig.Minimize.order,
  })
  private minimize(): void {}

  @MenuItem({
    id: WindowMenuConfig.Zoom.id,
    role: 'zoom',
    order: WindowMenuConfig.Zoom.order,
  })
  private zoom(): void {}

  @MenuItem({
    id: WindowMenuConfig.Sep1.id,
    type: 'separator',
    order: WindowMenuConfig.Sep1.order,
  })
  private sep1(): void {}

  @MenuItem({
    id: WindowMenuConfig.Close.id,
    role: 'close',
    order: WindowMenuConfig.Close.order,
  })
  private close(): void {}

  @MenuItem({
    id: WindowMenuConfig.Sep2.id,
    type: 'separator',
    order: WindowMenuConfig.Sep2.order,
  })
  private sep2(): void {}

  @MenuItem({
    id: WindowMenuConfig.Front.id,
    role: 'front',
    order: WindowMenuConfig.Front.order,
  })
  private front(): void {}

  @MenuItem({
    id: WindowMenuConfig.SepCustom.id,
    type: 'separator',
    order: WindowMenuConfig.SepCustom.order,
  })
  private sepCustom(): void {}

  @MenuItem({
    id: WindowMenuConfig.RefreshBounds.id,
    label(this: WindowMenu) {
      return this.i18n.translate('menu.window.refreshBounds');
    },
    accelerator: 'CmdOrCtrl+D',
    order: WindowMenuConfig.RefreshBounds.order,
    forwardToRenderer: true,
  })
  private refreshBounds(): void {}

  @MenuItem({
    id: WindowMenuConfig.RandomBounds.id,
    label(this: WindowMenu) {
      return this.i18n.translate('menu.window.randomBounds');
    },
    accelerator: 'CmdOrCtrl+Shift+D',
    order: WindowMenuConfig.RandomBounds.order,
    forwardToRenderer: true,
  })
  private randomBounds(): void {}

  @MenuItem({
    id: WindowMenuConfig.CenterWindow.id,
    label(this: WindowMenu) {
      return this.i18n.translate('menu.window.centerWindow');
    },
    accelerator: 'CmdOrCtrl+Shift+C',
    order: WindowMenuConfig.CenterWindow.order,
    forwardToRenderer: true,
  })
  private centerWindow(): void {}

  @MenuItem({
    id: WindowMenuConfig.AutoCenter.id,
    label(this: WindowMenu) {
      return this.i18n.translate('menu.window.autoCenter');
    },
    type: 'checkbox',
    checked: false,
    order: WindowMenuConfig.AutoCenter.order,
    handleInMain: true,
    forwardToRenderer: true,
  })
  private autoCenter(itemId: string, windowName: string): void {
    console.log(`[menu][window] clicked '${itemId}' for window '${windowName}'`);
  }
}
