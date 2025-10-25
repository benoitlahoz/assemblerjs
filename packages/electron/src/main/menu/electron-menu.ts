import { AbstractAssemblage } from 'assemblerjs';
import { Await } from '@assemblerjs/core';
import { Menu } from 'electron';
import { ElectronMenuItem } from './electron-menu-item';

export abstract class ElectronMenu implements AbstractAssemblage {
  protected ready = false;
  protected items: ElectronMenuItem[] = [];

  constructor(
    protected localizationService: { translate: (key: string) => string }
  ) {
    this.ready = true;
  }

  /**
   * Applies the current menu to the Electron application.
   * @returns {Promise<this>} The current instance after focus.
   */
  public async focus(): Promise<this> {
    await this.whenReady();
    const menuItems = this.items.map((item) =>
      item.toMenuItemConstructorOptions()
    );
    Menu.setApplicationMenu(Menu.buildFromTemplate(menuItems));
    return this;
  }

  /**
   * Enables or disables a menu item by its identifier.
   * @param id The identifier of the item.
   * @param enabled True to enable, false to disable.
   * @returns {this} The current instance.
   */
  public setItemEnabled(id: string, enabled: boolean): this {
    const item = this.itemById(id);
    if (item) {
      item.enabled = enabled;
    }
    return this;
  }

  /**
   * Enables all menu items.
   * @returns {this} The current instance.
   */
  public enableAll(): this {
    this.items.forEach((item) => item.enableAll());
    return this;
  }

  /**
   * Disables all menu items.
   * @returns {this} The current instance.
   */
  public disableAll(): this {
    this.items.forEach((item) => item.disableAll());
    return this;
  }

  /**
   * Clears the list of items and removes the menu from the application.
   * @returns {this} The current instance.
   */
  public clear(): this {
    this.items = [];
    Menu.setApplicationMenu(null);
    return this;
  }

  /**
   * Adds an item to the menu.
   * @param item The item to add.
   * @returns {this} The current instance.
   */
  public registerItem(item: ElectronMenuItem): this {
    const existing = this.itemById(item.id);
    if (existing) {
      throw new Error(`Menu item with id "${item.id}" already exists.`);
    }
    this.items.push(item);
    return this;
  }

  /**
   * Finds an item by its identifier, searching recursively in submenus.
   * @param id The identifier of the item.
   * @returns {ElectronMenuItem | undefined} The found item or undefined.
   */
  public itemById(id: string): ElectronMenuItem | undefined {
    function findIn(items: ElectronMenuItem[]): ElectronMenuItem | undefined {
      for (const item of items) {
        if (item.id === id) return item;
        if (item.submenu) {
          const found = findIn(item.submenu);
          if (found) return found;
        }
      }
      return undefined;
    }
    return findIn(this.items);
  }

  @Await('ready')
  /**
   * Waits until the menu is ready to be used.
   * @returns {Promise<void>} A promise resolved when ready.
   */
  public async whenReady(): Promise<void> {
    return;
  }
}
