import { Event, Menu, MenuItem, MenuItemConstructorOptions } from 'electron';
import { ElectronWindow } from '@/main';
import { buildMenuEventChannel } from '@/universal';
import { MenuIpcChannel } from '@/universal';
import type { MenuItemClickedEvent } from '@/universal';

export class ElectronMenuItem {
  private _id = 'ElectronMenuItem';
  private _label?: string;
  private _role?: string;
  private _type?:
    | 'normal'
    | 'separator'
    | 'submenu'
    | 'checkbox'
    | 'radio'
    | 'header'
    | 'palette' = undefined;
  private _accelerator?: string;
  private _checked?: boolean;
  private _enabled = true;
  private _submenu: ElectronMenuItem[] | null = null;
  protected _click?: (
    menuItem: MenuItem,
    browserWindow: ElectronWindow | undefined,
    event: Event,
  ) => void;

  private resolveTargetWindow(
    browserWindow: ElectronWindow | undefined,
  ): ElectronWindow | undefined {
    if (browserWindow && !browserWindow.isDestroyed()) {
      return browserWindow;
    }

    const focusedWindow =
      ElectronWindow.getFocusedWindow() as ElectronWindow | null;

    if (focusedWindow && !focusedWindow.isDestroyed()) {
      return focusedWindow;
    }

    const firstAliveWindow = ElectronWindow.getAllWindows().find(
      (window) => !window.isDestroyed(),
    ) as ElectronWindow | undefined;

    if (firstAliveWindow) {
      return firstAliveWindow;
    }

    return undefined;
  }

  /**
   * Sets the checked state of the menu item.
   * @param value True if checked, false otherwise.
   */
  public set checked(value: boolean | undefined) {
    const item = this.getItem();
    if (item) {
      try {
        item.checked = value ?? false;
      } catch {
        // Some Electron MenuItem instances expose readonly checked.
      }
      this._checked = item.checked ?? value;
      return;
    }
    this._checked = value;
  }

  /**
   * Gets the checked state of the menu item.
   * @returns {boolean | undefined} True if checked, false otherwise.
   */
  public get checked(): boolean | undefined {
    const item = this.getItem();
    if (item) {
      this._checked = item.checked;
      return this._checked;
    }
    return this._checked;
  }

  /**
   * Sets the identifier of the menu item.
   * @param value The identifier string.
   */
  public set id(value: string) {
    const item = this.getItem();
    if (item) {
      try {
        item.id = value;
      } catch {
        // Some Electron MenuItem instances expose readonly id.
      }
      this._id = item.id ?? value;
      return;
    }
    this._id = value;
  }

  /**
   * Gets the identifier of the menu item.
   * @returns {string} The identifier string.
   */
  public get id(): string {
    const item = this.getItem();
    if (item) {
      this._id = item.id;
      return this._id;
    }
    return this._id;
  }

  /**
   * Sets the label of the menu item.
   * @param value The label string.
   */
  public set label(value: string | undefined) {
    if (!value) {
      return;
    }

    const item = this.getItem();
    if (item) {
      try {
        if (item.label !== value) {
          item.label = value;
        }
      } catch {
        // Some Electron MenuItem instances expose readonly label.
      }
      this._label = item.label ?? value;
      return;
    }
    this._label = value;
  }

  /**
   * Gets the label of the menu item.
   * @returns {string | undefined} The label string.
   */
  public get label(): string | undefined {
    const item = this.getItem();
    if (item) {
      this._label = item.label;
      return this._label;
    }
    return this._label;
  }

  /**
   * Sets the role of the menu item.
   * @param value The role string.
   */
  public set role(value: string) {
    const item = this.getItem();
    if (item) {
      try {
        if (item.role !== value) {
          item.role = value as any;
        }
      } catch {
        // Some Electron MenuItem instances expose readonly role.
      }
      this._role = item.role ?? value;
      return;
    }
    this._role = value;
  }

  /**
   * Gets the role of the menu item.
   * @returns {string | undefined} The role string.
   */
  public get role(): string | undefined {
    const item = this.getItem();
    if (item) {
      this._role = item.role;
      return this._role;
    }
    return this._role;
  }

  /**
   * Sets whether the menu item is enabled.
   * @param value True to enable, false to disable.
   */
  public set enabled(value: boolean) {
    const item = this.getItem();
    if (item) {
      try {
        item.enabled = value;
      } catch {
        // Some Electron MenuItem instances expose readonly enabled.
      }
      this._enabled = item.enabled ?? value;
      return;
    }
    this._enabled = value;
  }

  /**
   * Gets whether the menu item is enabled.
   * @returns {boolean} True if enabled, false otherwise.
   */
  public get enabled(): boolean {
    const item = this.getItem();
    if (item) {
      this._enabled = item.enabled;
      return this._enabled;
    }
    return this._enabled;
  }

  /**
   * Sets the type of the menu item.
   * @param value The type of the menu item.
   */
  public set type(
    value:
      | 'normal'
      | 'separator'
      | 'submenu'
      | 'checkbox'
      | 'radio'
      | 'header'
      | 'palette'
      | undefined,
  ) {
    const item = this.getItem();
    if (item) {
      try {
        if (item.type !== (value as any)) {
          item.type = value as any;
        }
      } catch {
        // Some role-driven Electron MenuItem instances expose readonly type.
      }

      this._type = (item.type as any) ?? value;
      return;
    }
    this._type = value;
  }

  /**
   * Gets the type of the menu item.
   * @returns {'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio' | 'header' | 'palette' | undefined} The type of the menu item.
   */
  public get type():
    | 'normal'
    | 'separator'
    | 'submenu'
    | 'checkbox'
    | 'radio'
    | 'header'
    | 'palette'
    | undefined {
    const item = this.getItem();
    if (item) {
      this._type = item.type;
      return this._type;
    }
    return this._type;
  }

  /**
   * Sets the accelerator (keyboard shortcut) for the menu item.
   * @param value The accelerator string.
   */
  public set accelerator(value: string | undefined) {
    const item = this.getItem();
    if (item) {
      try {
        if (item.accelerator !== value) {
          item.accelerator = value;
        }
      } catch {
        // Some role-driven Electron MenuItem instances expose readonly accelerator.
      }

      this._accelerator = item.accelerator ?? value;
      return;
    }
    this._accelerator = value;
  }

  /**
   * Gets the accelerator (keyboard shortcut) for the menu item.
   * @returns {string | undefined} The accelerator string.
   */
  public get accelerator(): string | undefined {
    const item = this.getItem();
    if (item) {
      this._accelerator = item.accelerator;
      return this._accelerator;
    }
    return this._accelerator;
  }

  /**
   * Sets the submenu items for this menu item.
   * @param value The array of submenu items.
   */
  public set submenu(value: ElectronMenuItem[]) {
    const item = this.getItem();
    if (item) {
      try {
        item.submenu = Menu.buildFromTemplate(
          value.map((i) => i.toMenuItemConstructorOptions()),
        );
      } catch {
        // Some Electron MenuItem instances expose readonly submenu.
      }

      this._submenu = value;
      return;
    }
    this._submenu = value;
  }

  /**
   * Gets the submenu items for this menu item.
   * @returns {ElectronMenuItem[] | null} The array of submenu items or null.
   */
  public get submenu(): ElectronMenuItem[] | null {
    return this._submenu;
  }

  /**
   * Gets the click handler for the menu item.
   * @returns The click handler function.
   */
  public get click():
    | ((menuItem: MenuItem, browserWindow: any, event: any) => void)
    | undefined {
    return this._click;
  }

  /**
   * Sets the click handler for the menu item.
   * @param value The click handler function.
   */
  public set click(
    value: (menuItem: MenuItem, browserWindow: any, event: any) => void,
  ) {
    const item = this.getItem();
    if (item) {
      item.click = value;
      this._click = item.click as any;
      return;
    }
    this._click = value;
  }

  /**
   * Enables this menu item and all its submenu items.
   * @returns {this} The current instance.
   */
  public enableAll(): this {
    this.enabled = true;
    if (this.submenu) {
      this.submenu.forEach((item) => item.enableAll());
    }
    return this;
  }

  /**
   * Disables this menu item and all its submenu items.
   * @returns {this} The current instance.
   */
  public disableAll(): this {
    this.enabled = false;
    if (this.submenu) {
      this.submenu.forEach((item) => item.disableAll());
    }
    return this;
  }

  /**
   * Configures a handler to process click events in the main process.
   * Can be chained with forwardClickToRenderer() for dual handling.
   *
   * @param callback Handler function receiving itemId and windowName.
   * @returns {this} The current instance.
   *
   * @example
   * ```ts
   * menuItem
   *   .handleInMain((id, win) => console.log('Main:', id))
   *   .forwardClickToRenderer();
   * ```
   */
  public handleInMain(
    callback: (itemId: string, windowName: string) => void,
  ): this {
    // CRITICAL: Capture ID NOW to avoid closure issues when cloning
    const capturedId = this.id;
    const previousClick = this._click;

    this.click = (
      menuItem: MenuItem,
      browserWindow: ElectronWindow | undefined,
      event: Event,
    ) => {
      const targetWindow = this.resolveTargetWindow(browserWindow);
      if (!targetWindow) return;

      const windowName = targetWindow.name;

      // Execute the main handler
      callback(capturedId, windowName);

      // Call any previously configured click handler
      if (previousClick) {
        previousClick(menuItem, targetWindow, event);
      }
    };
    return this;
  }

  /**
   * Configures this menu item to forward click events to the renderer via IPC.
   * Uses the standard menu:item.clicked channel with [itemId, windowName] payload.
   * Can be chained with handleInMain() for dual handling.
   *
   * @param payloadFactory Optional factory function to customize payload.
   *                       Receives (itemId, windowName) and returns [itemId, windowName] or custom tuple.
   * @returns {this} The current instance.
   *
   * @example
   * ```ts
   * menuItem.forwardClickToRenderer();
   * // Sends: ['myItemId', 'myWindow']
   *
   * menuItem
   *   .handleInMain((id, win) => console.log('Main:', id))
   *   .forwardClickToRenderer((id, win) => [`custom-${id}`, win]);
   * ```
   */
  public forwardClickToRenderer(
    payloadFactory?: (
      itemId: string,
      windowName: string,
    ) => [itemId: string, windowName: string],
  ): this {
    // CRITICAL: Capture values NOW to avoid closure issues when cloning
    const capturedId = this.id;
    const capturedAccelerator = this.accelerator;
    const previousClick = this._click;

    this.click = (
      menuItem: MenuItem,
      browserWindow: ElectronWindow | undefined,
      event: Event,
    ) => {
      const targetWindow = this.resolveTargetWindow(browserWindow);
      if (!targetWindow) return;

      const windowName = targetWindow.name;

      // Call any previously configured click handler (e.g., from handleInMain)
      if (previousClick) {
        previousClick(menuItem, targetWindow, event);
      }

      // Forward to renderer
      const payload = payloadFactory
        ? payloadFactory(capturedId, windowName)
        : [capturedId, windowName];

      const scopedPayload: MenuItemClickedEvent = {
        itemId: capturedId,
        windowName,
        checked: menuItem.checked,
        accelerator: capturedAccelerator,
        timestampMs: Date.now(),
      };

      targetWindow.webContents.send(
        buildMenuEventChannel(windowName, 'itemClicked'),
        scopedPayload,
      );

      targetWindow.webContents.send(MenuIpcChannel.OnItemClicked, ...payload);
    };
    return this;
  }

  /**
   * Converts this menu item to a MenuItemConstructorOptions object for Electron.
   * @returns {MenuItemConstructorOptions} The options object.
   */
  public toMenuItemConstructorOptions(): MenuItemConstructorOptions {
    const options: MenuItemConstructorOptions = {
      id: this.id,
      label: this.label,
      role: this.role as any,
      type: this.type,
      accelerator: this.accelerator,
      enabled: this._enabled,
      submenu: this.submenu
        ? this.submenu.map((item) => item.toMenuItemConstructorOptions())
        : undefined,
    };
    if (this._checked !== undefined) {
      options.checked = this._checked;
    }
    if (typeof this._click === 'function') {
      options.click = this._click as any;
    }
    return options;
  }

  /**
   * Retrieves the corresponding Electron MenuItem from the application menu by id.
   * @returns {MenuItem | null | undefined} The Electron MenuItem or null/undefined if not found.
   */
  private getItem(): MenuItem | null | undefined {
    const menu = Menu.getApplicationMenu();
    const thisItem = menu?.getMenuItemById(this._id);
    return thisItem;
  }
}
