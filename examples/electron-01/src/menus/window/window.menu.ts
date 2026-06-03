import { Assemblage } from 'assemblerjs';
import { MenuItem, SubMenu } from '@assemblerjs/electron';
import { I18nService } from '@features/i18n/main';
import { WindowCustomMenu } from './window-custom.menu';

export const WindowMenuConfig = {
  Minimize: { id: 'window.minimize', order: 10 },
  Zoom: { id: 'window.zoom', order: 20 },
  Sep1: { id: 'window.sep.1', order: 30 },
  Close: { id: 'window.close', order: 40 },
  Sep2: { id: 'window.sep.2', order: 50 },
  Front: { id: 'window.front', order: 60 },
  SepCustom: { id: 'window.sep.custom', order: 70 },
  CustomMenu: { id: 'window.custom', order: 80 },
} as const;

@MenuItem('Window')
@Assemblage({
  provide: [[WindowCustomMenu]],
})
export class WindowMenu {
  constructor(
    public readonly i18n: I18nService,
    public readonly customMenu: WindowCustomMenu,
  ) {}

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

  @SubMenu({
    id: WindowMenuConfig.CustomMenu.id,
    order: WindowMenuConfig.CustomMenu.order,
  })
  private custom(): WindowCustomMenu {
    return this.customMenu;
  }
}
