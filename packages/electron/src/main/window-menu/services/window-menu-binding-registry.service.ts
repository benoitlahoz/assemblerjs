import { Assemblage, getAssemblageContext } from 'assemblerjs';
import { MapNamedRegistry } from '@assemblerjs/common';
import {
  AbstractMenuControllerService,
  MenuControllerService,
} from '@/main/menu/services';
import { AbstractMenuRegistryService } from './menu-registry.abstract';
import { MenuRegistryService } from './menu-registry.service';
import {
  AbstractWindowMenuBindingRegistryService,
  type WindowMenuBindingEntry,
} from './window-menu-binding-registry.abstract';
import type { MenuReference } from '../contracts';

@Assemblage()
export class WindowMenuBindingRegistryService
  extends MapNamedRegistry<string, WindowMenuBindingEntry>
  implements AbstractWindowMenuBindingRegistryService
{
  public async attach(windowName: string, menu: MenuReference): Promise<void> {
    const current = this.get(windowName);
    if (current && current.menu === menu) {
      return;
    }

    const menus = this.resolveMenuController();
    const menuRegistry = this.resolveMenuRegistry();
    const menuInstance = menuRegistry.resolveMenu(menu);

    menus.registerMenu(windowName, menuInstance);
    await menus.focus(windowName);

    this.register(windowName, { menu });
  }

  public detach(windowName: string): void {
    const current = this.get(windowName);
    if (!current) {
      return;
    }

    const menus = this.resolveMenuController();
    menus.unregisterMenu(windowName);

    this.unregister(windowName);
  }

  public async refresh(windowName: string): Promise<void> {
    if (!this.has(windowName)) {
      return;
    }

    const menus = this.resolveMenuController();
    await menus.focus(windowName);
  }

  private resolveMenuController(): AbstractMenuControllerService {
    const context = getAssemblageContext(this.constructor);

    try {
      return context.require(AbstractMenuControllerService);
    } catch {
      try {
        return context.require(MenuControllerService);
      } catch {
        return new MenuControllerService();
      }
    }
  }

  private resolveMenuRegistry(): AbstractMenuRegistryService {
    const context = getAssemblageContext(this.constructor);

    try {
      return context.require(AbstractMenuRegistryService);
    } catch {
      try {
        return context.require(MenuRegistryService);
      } catch {
        return new MenuRegistryService();
      }
    }
  }
}
