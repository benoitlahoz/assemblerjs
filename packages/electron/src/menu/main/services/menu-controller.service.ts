import type { AbstractAssemblage, AssemblerContext } from 'assemblerjs';
import { ipcMain, Menu } from 'electron';
import { ElectronWindow } from '@/window/main/classes/electron-window';
import { ElectronMenu, ElectronMenuItem } from '@/menu/main/model';
import { registerCleanup } from '@/common/lifecycle';
import { createChannelBuilder } from '@assemblerjs/common';
import { MenuIpcChannel } from '@/common';
import type { IpcReturnType, MenuItemState, MenuSnapshot } from '@/common';

const buildMenuChannel = createChannelBuilder('menu');

interface MenuRegistration {
  windowName: string;
  menuName: string;
  menu: ElectronMenu;
  window?: ElectronWindow;
}

/**
 * Base menu controller for main process.
 * Users should extend this class to create their own menu controller.
 *
 * @example
 * ```typescript
 * @MenuOrchestrator()
 * @Assemblage({ provide: [[AppMenu], [EditMenu]] })
 * export class MenuController extends BaseMenuController {}
 * ```
 */
export class BaseMenuController implements AbstractAssemblage {
  private static readonly registrations = new Map<string, MenuRegistration>();
  private static globalRegistration?: Omit<
    MenuRegistration,
    'windowName' | 'window'
  >;
  private globalHandlersRegistered = false;
  private readonly scopedHandlers = new Set<string>();

  constructor() {
    this.registerGlobalHandlers();
  }

  private requireRegistration(
    windowName: string,
    event?: unknown,
  ): MenuRegistration {
    const sender = (event as { sender?: Electron.WebContents } | undefined)
      ?.sender;
    const senderWindow = sender
      ? ElectronWindow.getByWebContents(sender)
      : undefined;
    const senderRegistration = senderWindow
      ? BaseMenuController.registrations.get(String(senderWindow.id))
      : undefined;
    const focusedWindow =
      ElectronWindow.getFocusedWindow() as ElectronWindow | null;
    const focusedRegistration = focusedWindow
      ? BaseMenuController.registrations.get(String(focusedWindow.id))
      : undefined;
    const matchingRegistrations = [
      ...BaseMenuController.registrations.values(),
    ].filter((candidate) => candidate.windowName === windowName);
    const registration =
      (senderRegistration?.windowName === windowName
        ? senderRegistration
        : undefined) ||
      BaseMenuController.registrations.get(windowName) ||
      (focusedRegistration?.windowName === windowName
        ? focusedRegistration
        : undefined) ||
      (matchingRegistrations.length === 1
        ? matchingRegistrations[0]
        : undefined);
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
      accelerator: item.accelerator,
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

  private emit(
    registration: MenuRegistration,
    channel: string,
    ...args: any[]
  ): void {
    const window =
      registration.window || ElectronWindow.getByName(registration.windowName);
    if (!window || window.isDestroyed()) {
      return;
    }

    // Don't send if webContents is not ready yet
    if (!window.webContents || window.webContents.isDestroyed()) {
      return;
    }

    window.webContents.send(channel, ...args);
  }

  private emitTemplateChanged(windowName: string): void {
    const registration = this.requireRegistration(windowName);
    const registeredWindowName = registration.windowName;
    const window =
      registration.window || ElectronWindow.getByName(registration.windowName);

    if (!window || window.isDestroyed()) {
      return;
    }

    const webContents = window.webContents;
    if (!webContents || webContents.isDestroyed()) {
      return;
    }

    // Helper to emit the events
    const emitEvents = (): void => {
      this.emit(
        registration,
        buildMenuChannel(registeredWindowName, 'templateChanged'),
        registration.menuName,
      );
      this.emit(
        registration,
        MenuIpcChannel.OnTemplateChanged,
        registeredWindowName,
        registration.menuName,
      );
    };

    // If the page is already loaded, emit immediately
    if (!webContents.isLoading()) {
      emitEvents();
    } else {
      // Otherwise, wait for the page to finish loading
      webContents.once('dom-ready', () => {
        emitEvents();
      });
    }
  }

  private emitStateChanged(
    registration: MenuRegistration,
    state: MenuItemState,
  ): void {
    this.emit(
      registration,
      buildMenuChannel(registration.windowName, 'stateChanged'),
      state,
    );
    this.emit(
      registration,
      MenuIpcChannel.OnItemStateChanged,
      registration.windowName,
      state,
    );
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
      (event, windowName: string) =>
        this.toIpcResult(() => this.snapshot(windowName, event)),
    );

    this.registerHandler(
      MenuIpcChannel.SetItemEnabled,
      (event, windowName: string, itemId: string, enabled: boolean) =>
        this.toIpcResult(() =>
          this.setItemEnabled(windowName, itemId, enabled, event),
        ),
    );

    this.registerHandler(
      MenuIpcChannel.SetItemChecked,
      (event, windowName: string, itemId: string, checked: boolean) =>
        this.toIpcResult(() =>
          this.setItemChecked(windowName, itemId, checked, event),
        ),
    );

    this.globalHandlersRegistered = true;
  }

  private registerScopedHandlers(windowName: string): void {
    const descriptors: Array<
      [string, (_event: unknown, ...args: any[]) => any]
    > = [
      [
        buildMenuChannel(windowName, 'snapshot'),
        (event) => this.toIpcResult(() => this.snapshot(windowName, event)),
      ],
      [
        buildMenuChannel(windowName, 'setItemEnabled'),
        (event, itemId: string, enabled: boolean) =>
          this.toIpcResult(() =>
            this.setItemEnabled(windowName, itemId, enabled, event),
          ),
      ],
      [
        buildMenuChannel(windowName, 'setItemChecked'),
        (event, itemId: string, checked: boolean) =>
          this.toIpcResult(() =>
            this.setItemChecked(windowName, itemId, checked, event),
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
    window?: ElectronWindow,
  ): this {
    this.registerGlobalHandlers();
    const registeredWindowName = window?.name ?? windowName;
    this.registerScopedHandlers(registeredWindowName);

    const scope = window ? String(window.id) : windowName;
    BaseMenuController.registrations.set(scope, {
      windowName: registeredWindowName,
      menuName,
      menu,
      window,
    });

    return this;
  }

  public async registerGlobalMenu(
    menu: ElectronMenu,
    menuName = 'globalMenu',
  ): Promise<this> {
    BaseMenuController.globalRegistration = { menuName, menu };
    if (BaseMenuController.registrations.size === 0) {
      await this.focusGlobal();
    }
    return this;
  }

  public async focusGlobal(): Promise<boolean> {
    const globalRegistration = BaseMenuController.globalRegistration;
    if (!globalRegistration) {
      return false;
    }

    await globalRegistration.menu.focus();
    return true;
  }

  public async replaceSubmenuItems(
    window: ElectronWindow | undefined,
    parentItemId: string,
    items: ElectronMenuItem[],
  ): Promise<boolean> {
    const registration = window
      ? BaseMenuController.registrations.get(String(window.id))
      : BaseMenuController.globalRegistration;

    if (
      !registration ||
      (window &&
        (!('window' in registration) || registration.window !== window))
    ) {
      return false;
    }

    const parent = registration.menu.itemById(parentItemId);
    if (!parent) {
      return false;
    }

    parent.replaceSubmenuItems(items);

    if (window) {
      const focusedWindow =
        ElectronWindow.getFocusedWindow() as ElectronWindow | null;
      if (focusedWindow?.id === window.id) {
        await registration.menu.focus();
      }
    } else if (BaseMenuController.registrations.size === 0) {
      await registration.menu.focus();
    }

    return true;
  }

  public unregisterGlobalMenu(): this {
    BaseMenuController.globalRegistration = undefined;
    if (BaseMenuController.registrations.size === 0) {
      Menu.setApplicationMenu(null);
    }
    return this;
  }

  public unregisterMenu(windowScope: string): this {
    BaseMenuController.registrations.delete(windowScope);
    if (BaseMenuController.registrations.size === 0) {
      if (BaseMenuController.globalRegistration) {
        void this.focusGlobal();
      } else {
        Menu.setApplicationMenu(null);
      }
    }
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
    event?: unknown,
  ): boolean {
    const registration = this.requireRegistration(windowName, event);
    const item = registration.menu.itemById(itemId);
    if (!item) {
      return false;
    }

    if (item.enabled === enabled) {
      return true;
    }

    item.enabled = enabled;
    this.emitStateChanged(registration, this.getState(item));
    return true;
  }

  public setItemChecked(
    windowName: string,
    itemId: string,
    checked: boolean,
    event?: unknown,
  ): boolean {
    const registration = this.requireRegistration(windowName, event);
    const item = registration.menu.itemById(itemId);
    if (!item) {
      return false;
    }

    if (item.checked === checked) {
      return true;
    }

    item.checked = checked;
    this.emitStateChanged(registration, this.getState(item));
    return true;
  }

  public snapshot(windowName: string, event?: unknown): MenuSnapshot {
    const registration = this.requireRegistration(windowName, event);
    const items = this.collectItemStates(registration.menu.getItems());
    return {
      windowName,
      menuName: registration.menuName,
      items,
      updatedAt: Date.now(),
    };
  }

  public onDispose(
    _context: AssemblerContext,
    _configuration?: Record<string, any>,
  ): void {
    BaseMenuController.registrations.clear();
    BaseMenuController.globalRegistration = undefined;
    this.scopedHandlers.clear();
    this.globalHandlersRegistered = false;
  }
}

const baseMenuControllerKey = Symbol.for(
  'assemblerjs.electron.baseMenuController',
);

export function resolveBaseMenuController(owner: any): BaseMenuController {
  const injected = owner?.menus;
  if (
    injected &&
    typeof injected.registerMenu === 'function' &&
    typeof injected.unregisterMenu === 'function'
  ) {
    return injected as BaseMenuController;
  }

  if (owner?.[baseMenuControllerKey]) {
    return owner[baseMenuControllerKey] as BaseMenuController;
  }

  const controller = new BaseMenuController();
  Object.defineProperty(owner, baseMenuControllerKey, {
    configurable: true,
    value: controller,
  });
  return controller;
}
