import { Assemblage, getAssemblageContext } from 'assemblerjs';
import { MapNamedRegistry } from '@assemblerjs/common';
import { ElectronWindow } from '@/window/main/classes';
import { ElectronMenu } from '@/menu/main/model/electron-menu';
import { BaseMenuController } from '@/menu/main/services';
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
  private isMissingMenuRegistrationError(error: unknown): boolean {
    return (
      error instanceof Error &&
      error.message.startsWith('No menu registered for window')
    );
  }

  private async focusMenuSafely(windowName: string): Promise<void> {
    const menus = this.resolveMenuController();

    try {
      await menus.focus(windowName);
    } catch (error) {
      if (!this.isMissingMenuRegistrationError(error)) {
        throw error;
      }
    }
  }

  private resolveFocusedWindowScope(): string | undefined {
    const focusedWindow =
      typeof (
        ElectronWindow as typeof ElectronWindow & {
          getFocusedWindow?: () => ElectronWindow | null;
        }
      ).getFocusedWindow === 'function'
        ? (
            ElectronWindow as typeof ElectronWindow & {
              getFocusedWindow: () => ElectronWindow | null;
            }
          ).getFocusedWindow()
        : null;

    const focusedWindowScope = focusedWindow
      ? String(focusedWindow.id)
      : undefined;

    if (focusedWindowScope && this.has(focusedWindowScope)) {
      return focusedWindowScope;
    }

    return undefined;
  }

  private resolveFallbackWindowName(): string | undefined {
    for (const entry of this.list()) {
      const numericId = Number(entry.name);
      const candidate = Number.isInteger(numericId)
        ? ElectronWindow.getById(numericId)
        : ElectronWindow.getByName(entry.name);
      if (candidate && !candidate.isDestroyed()) {
        return entry.name;
      }
    }

    return undefined;
  }

  private refreshBestAvailableWindowMenu(): void {
    const target =
      this.resolveFocusedWindowScope() || this.resolveFallbackWindowName();

    if (!target) {
      return;
    }

    void this.focusMenuSafely(target);
  }

  public async attach(
    windowName: string,
    menu: MenuReference | ElectronMenu,
    windowInstance?: ElectronWindow,
  ): Promise<void> {
    const scope = windowInstance ? String(windowInstance.id) : windowName;
    const current = this.get(scope);
    if (current && current.menu === menu) {
      return;
    }

    const menus = this.resolveMenuController();

    let menuInstance: ElectronMenu;
    if (menu instanceof ElectronMenu) {
      menuInstance = menu;
    } else {
      const menuRegistry = this.resolveMenuRegistry();
      menuInstance = menuRegistry.resolveMenu(menu as MenuReference);
    }

    menus.registerMenu(scope, menuInstance, 'mainMenu', windowInstance);
    await menus.focus(scope);

    // For composed menus we store the window name as sentinel; for token menus store the reference.
    this.register(scope, {
      menu: menu instanceof ElectronMenu ? scope : (menu as MenuReference),
    });
  }

  public detach(windowScope: string): void {
    const current = this.get(windowScope);
    if (!current) {
      return;
    }

    const menus = this.resolveMenuController();
    menus.unregisterMenu(windowScope);

    this.unregister(windowScope);

    this.refreshBestAvailableWindowMenu();
  }

  public async refresh(windowScope: string): Promise<void> {
    if (!this.has(windowScope)) {
      return;
    }

    await this.focusMenuSafely(windowScope);
  }

  private resolveMenuController(): BaseMenuController {
    return new BaseMenuController();
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
