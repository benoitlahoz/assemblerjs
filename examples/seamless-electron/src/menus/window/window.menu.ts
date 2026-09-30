import { Assemblage } from 'assemblerjs';
import { MenuItem, SubMenu, MenuSeparator } from '@assemblerjs/electron';
import { I18nService } from '@features/i18n/main';
import { WindowBoundsMenu } from './window-bounds.menu';

export const WindowMenuConfig = {
  Minimize: { id: 'window.minimize', order: 10 },
  Zoom: { id: 'window.zoom', order: 20 },
  Close: { id: 'window.close', order: 40 },
  Front: { id: 'window.front', order: 60 },
  SepBounds: { id: 'window.sep.bounds', order: 70 },
  BoundsMenu: { id: 'window.bounds', order: 80 },
} as const;

@MenuItem('Window')
@Assemblage({
  provide: [[WindowBoundsMenu]],
})
export class WindowMenu {
  constructor(
    public readonly i18n: I18nService,
    public readonly boundsMenu: WindowBoundsMenu,
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

  @MenuSeparator()
  @MenuItem({
    id: WindowMenuConfig.Close.id,
    role: 'close',
    order: WindowMenuConfig.Close.order,
  })
  private close(): void {}

  @MenuSeparator()
  @MenuItem({
    id: WindowMenuConfig.Front.id,
    role: 'front',
    order: WindowMenuConfig.Front.order,
  })
  private front(): void {}

  @MenuItem({
    id: WindowMenuConfig.SepBounds.id,
    type: 'separator',
    order: WindowMenuConfig.SepBounds.order,
  })
  private sepCustom(): void {}

  @SubMenu({
    id: WindowMenuConfig.BoundsMenu.id,
    order: WindowMenuConfig.BoundsMenu.order,
  })
  private custom(): WindowBoundsMenu {
    return this.boundsMenu;
  }
}
