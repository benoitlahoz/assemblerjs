import { Assemblage } from 'assemblerjs';
import { MenuItem } from '@assemblerjs/electron';
import { I18nService } from '@features/i18n/main';

const StandardWindowMenuConfig = {
  Minimize: { id: 'window.minimize', order: 10 },
  Zoom: { id: 'window.zoom', order: 20 },
  SeparatorMinimizeClose: { id: 'window.separator.minimize-close', order: 30 },
  Close: { id: 'window.close', order: 40 },
  SeparatorCloseFront: { id: 'window.separator.close-front', order: 50 },
  Front: { id: 'window.front', order: 60 },
} as const;

const MainWindowMenuConfig = {
  Minimize: { id: 'main.window.minimize', order: 10 },
  Zoom: { id: 'main.window.zoom', order: 20 },
  SeparatorMinimizeClose: { id: 'main.window.separator.minimize-close', order: 30 },
  Close: { id: 'main.window.close', order: 40 },
  SeparatorCloseFront: { id: 'main.window.separator.close-front', order: 50 },
  Front: { id: 'main.window.front', order: 60 },
  SeparatorCustomActions: { id: 'main.window.separator.custom-actions', order: 70 },
  RefreshBounds: { id: 'main.window.refreshBounds', order: 80 },
  RandomBounds: { id: 'main.window.randomBounds', order: 90 },
  CenterWindow: { id: 'main.window.centerWindow', order: 100 },
  AutoCenter: { id: 'main.menu.autoCenter', order: 110 },
} as const;

@MenuItem('Window')
@Assemblage()
export class StandardWindowMenu {
  @MenuItem({
    id: StandardWindowMenuConfig.Minimize.id,
    role: 'minimize',
    order: StandardWindowMenuConfig.Minimize.order,
  })
  private minimize(): void {}

  @MenuItem({
    id: StandardWindowMenuConfig.Zoom.id,
    role: 'zoom',
    order: StandardWindowMenuConfig.Zoom.order,
  })
  private zoom(): void {}

  @MenuItem({
    id: StandardWindowMenuConfig.SeparatorMinimizeClose.id,
    type: 'separator',
    order: StandardWindowMenuConfig.SeparatorMinimizeClose.order,
  })
  private separatorMinimizeClose(): void {}

  @MenuItem({
    id: StandardWindowMenuConfig.Close.id,
    role: 'close',
    order: StandardWindowMenuConfig.Close.order,
  })
  private close(): void {}

  @MenuItem({
    id: StandardWindowMenuConfig.SeparatorCloseFront.id,
    type: 'separator',
    order: StandardWindowMenuConfig.SeparatorCloseFront.order,
  })
  private separatorCloseFront(): void {}

  @MenuItem({
    id: StandardWindowMenuConfig.Front.id,
    role: 'front',
    order: StandardWindowMenuConfig.Front.order,
  })
  private front(): void {}
}

@MenuItem('Window')
@Assemblage()
export class MainWindowMenu {
  constructor(public readonly i18n: I18nService) {}

  @MenuItem({
    id: MainWindowMenuConfig.Minimize.id,
    role: 'minimize',
    order: MainWindowMenuConfig.Minimize.order,
  })
  private minimize(): void {}

  @MenuItem({
    id: MainWindowMenuConfig.Zoom.id,
    role: 'zoom',
    order: MainWindowMenuConfig.Zoom.order,
  })
  private zoom(): void {}

  @MenuItem({
    id: MainWindowMenuConfig.SeparatorMinimizeClose.id,
    type: 'separator',
    order: MainWindowMenuConfig.SeparatorMinimizeClose.order,
  })
  private separatorMinimizeClose(): void {}

  @MenuItem({
    id: MainWindowMenuConfig.Close.id,
    role: 'close',
    order: MainWindowMenuConfig.Close.order,
  })
  private close(): void {}

  @MenuItem({
    id: MainWindowMenuConfig.SeparatorCloseFront.id,
    type: 'separator',
    order: MainWindowMenuConfig.SeparatorCloseFront.order,
  })
  private separatorCloseFront(): void {}

  @MenuItem({
    id: MainWindowMenuConfig.Front.id,
    role: 'front',
    order: MainWindowMenuConfig.Front.order,
  })
  private front(): void {}

  @MenuItem({
    id: MainWindowMenuConfig.SeparatorCustomActions.id,
    type: 'separator',
    order: MainWindowMenuConfig.SeparatorCustomActions.order,
  })
  private separatorCustomActions(): void {}

  @MenuItem({
    id: MainWindowMenuConfig.RefreshBounds.id,
    label(this: MainWindowMenu) {
      return this.i18n.translate('menu.window.refreshBounds');
    },
    accelerator: 'CmdOrCtrl+D',
    order: MainWindowMenuConfig.RefreshBounds.order,
    forwardToRenderer: true,
  })
  private refreshBounds(): void {}

  @MenuItem({
    id: MainWindowMenuConfig.RandomBounds.id,
    label(this: MainWindowMenu) {
      return this.i18n.translate('menu.window.randomBounds');
    },
    accelerator: 'CmdOrCtrl+Shift+D',
    order: MainWindowMenuConfig.RandomBounds.order,
    forwardToRenderer: true,
  })
  private randomBounds(): void {}

  @MenuItem({
    id: MainWindowMenuConfig.CenterWindow.id,
    label(this: MainWindowMenu) {
      return this.i18n.translate('menu.window.centerWindow');
    },
    accelerator: 'CmdOrCtrl+Shift+C',
    order: MainWindowMenuConfig.CenterWindow.order,
    forwardToRenderer: true,
  })
  private centerWindow(): void {}

  @MenuItem({
    id: MainWindowMenuConfig.AutoCenter.id,
    label(this: MainWindowMenu) {
      return this.i18n.translate('menu.window.autoCenter');
    },
    type: 'checkbox',
    checked: false,
    order: MainWindowMenuConfig.AutoCenter.order,
    handleInMain: true,
    forwardToRenderer: true,
  })
  private autoCenter(itemId: string, windowName: string): void {
    console.log(`[menu][window] clicked '${itemId}' for window '${windowName}'`);
  }
}
