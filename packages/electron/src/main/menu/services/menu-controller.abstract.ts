import { AbstractAssemblage, AssemblerContext } from 'assemblerjs';
import type { ElectronMenu } from '@/main/menu';
import type { ElectronWindow } from '@/main/window/classes';
import type { MenuSnapshot } from '@/universal/types';

export abstract class AbstractMenuControllerService implements AbstractAssemblage {
  public abstract registerMenu(
    windowName: string,
    menu: ElectronMenu,
    menuName?: string,
    window?: ElectronWindow,
  ): this;

  public abstract unregisterMenu(windowName: string): this;

  public abstract focus(windowName: string): Promise<boolean>;

  public abstract setItemEnabled(
    windowName: string,
    itemId: string,
    enabled: boolean,
  ): boolean;

  public abstract setItemChecked(
    windowName: string,
    itemId: string,
    checked: boolean,
  ): boolean;

  public abstract snapshot(windowName: string): MenuSnapshot;

  public abstract onDispose(
    context: AssemblerContext,
    configuration?: Record<string, any>,
  ): void | Promise<void>;
}
