import { Assemblage } from 'assemblerjs';
import { ipcMain } from 'electron';
import { ElectronWindow } from '@/main/window/classes/electron-window';
import { ElectronMenu, ElectronMenuItem } from '@/main/menu/classes';
import { registerCleanup } from '@/universal/lifecycle';
import {
  buildMenuCommandChannel,
  buildMenuEventChannel,
  MenuIpcChannel,
} from '@/universal';
import type { IpcReturnType, MenuItemState, MenuSnapshot } from '@/universal';
import { AbstractMenuControllerService } from './menu-controller.abstract';

interface MenuRegistration {
  windowName: string;
  menuName: string;
  menu: ElectronMenu;
}

@Assemblage()
export class MenuControllerService extends AbstractMenuControllerService {
  private readonly registrations = new Map<string, MenuRegistration>();
  private globalHandlersRegistered = false;
  private readonly scopedHandlers = new Set<string>();

  private requireRegistration(windowName: string): MenuRegistration {
    const registration = this.registrations.get(windowName);
    if (!registration) {
      throw new Error(`No menu registered for window '${windowName}'.`);
    }

    return registration;
  }

  private toIpcResult<T>(factory: () => T): IpcReturnType<T> {
    try {
      return {
        data: factory(),
        err: null,
      };
    } catch (error) {
      return {
        data: null,
        err: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  private getState(item: ElectronMenuItem): MenuItemState {
    return {
      id: item.id,
      enabled: item.enabled,
      checked: item.checked,
      label: item.label,
    };
  }

  private collectItemStates(
    items: ReadonlyArray<ElectronMenuItem>,
  ): Record<string, MenuItemState> {
    const states: Record<string, MenuItemState> = {};

    const visit = (entry: ElectronMenuItem): void => {
      states[entry.id] = this.getState(entry);

      const submenu = entry.submenu;
      if (!submenu) {
        return;
      }

      for (const child of submenu) {
        visit(child);
      }
    };

    for (const item of items) {
      visit(item);
    }

    return states;
  }

  private emit(windowName: string, channel: string, ...args: any[]): void {
    const window = ElectronWindow.getByName(windowName);
    if (!window || window.isDestroyed()) {
      return;
    }

    window.webContents.send(channel, ...args);
  }

  private emitTemplateChanged(windowName: string): void {
    const registration = this.requireRegistration(windowName);

    this.emit(
      windowName,
      buildMenuEventChannel(windowName, 'templateChanged'),
      registration.menuName,
    );
    this.emit(
      windowName,
      MenuIpcChannel.OnTemplateChanged,
      windowName,
      registration.menuName,
    );
  }

  private emitStateChanged(windowName: string, state: MenuItemState): void {
    this.emit(
      windowName,
      buildMenuEventChannel(windowName, 'stateChanged'),
      state,
    );
    this.emit(windowName, MenuIpcChannel.OnItemStateChanged, windowName, state);
  }

  private registerHandler(
    channel: string,
    handler: (_event: unknown, ...args: any[]) => any,
  ): void {
    ipcMain.removeHandler(channel);
    ipcMain.handle(channel, handler);

    registerCleanup(this, () => {
      ipcMain.removeHandler(channel);
    });
  }

  private registerGlobalHandlers(): void {
    if (this.globalHandlersRegistered) {
      return;
    }

    this.registerHandler(
      MenuIpcChannel.GetSnapshot,
      (_event, windowName: string) =>
        this.toIpcResult(() => this.snapshot(windowName)),
    );

    this.registerHandler(
      MenuIpcChannel.SetItemEnabled,
      (_event, windowName: string, itemId: string, enabled: boolean) =>
        this.toIpcResult(() =>
          this.setItemEnabled(windowName, itemId, enabled),
        ),
    );

    this.registerHandler(
      MenuIpcChannel.SetItemChecked,
      (_event, windowName: string, itemId: string, checked: boolean) =>
        this.toIpcResult(() =>
          this.setItemChecked(windowName, itemId, checked),
        ),
    );

    this.globalHandlersRegistered = true;
  }

  private registerScopedHandlers(windowName: string): void {
    const descriptors: Array<
      [string, (_event: unknown, ...args: any[]) => any]
    > = [
      [
        buildMenuCommandChannel(windowName, 'snapshot'),
        () => this.toIpcResult(() => this.snapshot(windowName)),
      ],
      [
        buildMenuCommandChannel(windowName, 'setItemEnabled'),
        (_event, itemId: string, enabled: boolean) =>
          this.toIpcResult(() =>
            this.setItemEnabled(windowName, itemId, enabled),
          ),
      ],
      [
        buildMenuCommandChannel(windowName, 'setItemChecked'),
        (_event, itemId: string, checked: boolean) =>
          this.toIpcResult(() =>
            this.setItemChecked(windowName, itemId, checked),
          ),
      ],
    ];

    for (const [channel, handler] of descriptors) {
      if (this.scopedHandlers.has(channel)) {
        continue;
      }

      this.registerHandler(channel, handler);
      this.scopedHandlers.add(channel);
    }
  }

  public registerMenu(
    windowName: string,
    menu: ElectronMenu,
    menuName = 'mainMenu',
  ): this {
    this.registerGlobalHandlers();
    this.registerScopedHandlers(windowName);

    this.registrations.set(windowName, {
      windowName,
      menuName,
      menu,
    });

    return this;
  }

  public unregisterMenu(windowName: string): this {
    this.registrations.delete(windowName);
    return this;
  }

  public async focus(windowName: string): Promise<boolean> {
    const registration = this.requireRegistration(windowName);
    await registration.menu.focus();
    this.emitTemplateChanged(windowName);
    return true;
  }

  public setItemEnabled(
    windowName: string,
    itemId: string,
    enabled: boolean,
  ): boolean {
    const registration = this.requireRegistration(windowName);
    const item = registration.menu.itemById(itemId);
    if (!item) {
      return false;
    }

    if (item.enabled === enabled) {
      return true;
    }

    item.enabled = enabled;
    this.emitStateChanged(windowName, this.getState(item));
    return true;
  }

  public setItemChecked(
    windowName: string,
    itemId: string,
    checked: boolean,
  ): boolean {
    const registration = this.requireRegistration(windowName);
    const item = registration.menu.itemById(itemId);
    if (!item) {
      return false;
    }

    if (item.checked === checked) {
      return true;
    }

    item.checked = checked;
    this.emitStateChanged(windowName, this.getState(item));
    return true;
  }

  public snapshot(windowName: string): MenuSnapshot {
    const registration = this.requireRegistration(windowName);
    return {
      windowName,
      menuName: registration.menuName,
      items: this.collectItemStates(registration.menu.getItems()),
      updatedAt: Date.now(),
    };
  }

  public onDispose(): void {
    this.registrations.clear();
    this.scopedHandlers.clear();
    this.globalHandlersRegistered = false;
  }
}
