import 'reflect-metadata';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Assemblage } from 'assemblerjs';

vi.mock('electron', () => ({
  BrowserWindow: class BrowserWindow {},
  screen: {
    getDisplayMatching: () => ({
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
    }),
  },
  Menu: {
    getApplicationMenu: () => null,
    buildFromTemplate: (input: unknown) => input,
    setApplicationMenu: () => undefined,
  },
  MenuItem: class MenuItem {},
  ipcMain: {
    handle: () => undefined,
    removeHandler: () => undefined,
    on: () => undefined,
    once: () => undefined,
    off: () => undefined,
  },
}));

vi.mock('../src/main/index.ts', () => ({
  ElectronWindow: class ElectronWindow {
    public static getFocusedWindow(): null {
      return null;
    }
  },
}));

let ElectronMenu: typeof import('../src/main/menu/model/electron-menu').ElectronMenu;
let createMenuItem: typeof import('../src/main/menu/builders/create-menu-item').createMenuItem;
let MenuItem: typeof import('../src/main/menu/menu-item/menu-item.decorator').MenuItem;
let Menu: typeof import('../src/main/menu/menu-definition/menu.decorator').Menu;

beforeAll(async () => {
  ({ ElectronMenu } = await import('../src/main/menu/model/electron-menu'));
  ({ createMenuItem } =
    await import('../src/main/menu/builders/create-menu-item'));
  ({ MenuItem } =
    await import('../src/main/menu/menu-item/menu-item.decorator'));
  ({ Menu } = await import('../src/main/menu/menu-definition/menu.decorator'));
});

describe('@Menu auto bootstrap', () => {
  it('registers menu roots from declarative @MenuItem metadata', () => {
    @Menu({ name: 'mainMenu' })
    @Assemblage()
    class DeclarativeMenu extends ElectronMenu {
      constructor() {
        super();
      }

      @MenuItem({ id: 'main.window.refresh', path: 'Window', label: 'Refresh' })
      public refresh(): void {}
    }

    const menu = new DeclarativeMenu();

    expect(menu.getItems().length).toBe(1);
    expect(menu.getItems()[0]?.id).toBe('menu.window');
    expect(menu.itemById('main.window.refresh')?.label).toBe('Refresh');
  });

  it('does not duplicate items when constructor already registers manual items', () => {
    @Menu({ name: 'mainMenu' })
    @Assemblage()
    class MixedMenu extends ElectronMenu {
      constructor() {
        super();

        this.registerItem(
          createMenuItem({
            id: 'manual.root',
            label: 'Manual',
          }),
        );
      }

      @MenuItem({ id: 'main.window.refresh', path: 'Window', label: 'Refresh' })
      public refresh(): void {}
    }

    const menu = new MixedMenu();

    expect(menu.getItems().length).toBe(1);
    expect(menu.getItems()[0]?.id).toBe('manual.root');
    expect(menu.itemById('main.window.refresh')).toBeUndefined();
  });

  it('translates root group labels from menu root i18n service', () => {
    @Menu({ name: 'mainMenu' })
    @Assemblage()
    class LocalizedMenu extends ElectronMenu {
      public readonly i18n = {
        translate: (key: string) => {
          if (key === 'menu.group.window') return 'Fenetre';
          return key;
        },
      };

      constructor() {
        super();
      }

      @MenuItem({ id: 'main.window.refresh', path: 'Window', label: 'Refresh' })
      public refresh(): void {}
    }

    const menu = new LocalizedMenu();
    expect(menu.getItems()[0]?.label).toBe('Fenetre');
  });
});
