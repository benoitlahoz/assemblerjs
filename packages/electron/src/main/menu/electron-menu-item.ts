import { Event, Menu, MenuItem, MenuItemConstructorOptions } from 'electron';
import { ElectronWindow } from '../window';

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
    event: Event
  ) => void;

  /**
   * Sets the checked state of the menu item.
   * @param value True if checked, false otherwise.
   */
  public set checked(value: boolean | undefined) {
    const item = this.getItem();
    if (item) {
      item.checked = value ?? false;
      this._checked = item.checked;
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
      item.id = value;
      this._id = item.id;
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
      item.label = value;
      this._label = item.label;
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
      item.role = value as any;
      this._role = item.role;
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
      item.enabled = value;
      this._enabled = item.enabled;
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
      | undefined
  ) {
    const item = this.getItem();
    if (item) {
      item.type = value as any;
      this._type = item.type;
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
      item.accelerator = value;
      this._accelerator = item.accelerator;
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
      item.submenu = Menu.buildFromTemplate(
        value.map((i) => i.toMenuItemConstructorOptions())
      );
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
   * Sets the click handler for the menu item.
   * @param value The click handler function.
   */
  public set click(
    value: (menuItem: MenuItem, browserWindow: any, event: any) => void
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
      enabled: this.enabled,
      submenu: this.submenu
        ? this.submenu.map((item) => item.toMenuItemConstructorOptions())
        : undefined,
    };
    if (this.checked !== undefined) {
      options.checked = this.checked;
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
