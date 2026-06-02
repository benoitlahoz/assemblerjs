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

let ElectronMenu: typeof import('../src/main/menu/classes/electron-menu').ElectronMenu;
let createMenuItem: typeof import('../src/main/menu/classes/create-menu-item').createMenuItem;
let MenuFragment: typeof import('../src/main/menu/decorators/menu-fragment.decorator').MenuFragment;
let MenuItem: typeof import('../src/main/menu/decorators/menu-item.decorator').MenuItem;
let Menu: typeof import('../src/main/menu/decorators/menu.decorator').Menu;

beforeAll(async () => {
  ({ ElectronMenu } = await import('../src/main/menu/classes/electron-menu'));
  ({ createMenuItem } =
    await import('../src/main/menu/classes/create-menu-item'));
  ({ MenuFragment } =
    await import('../src/main/menu/decorators/menu-fragment.decorator'));
  ({ MenuItem } =
    await import('../src/main/menu/decorators/menu-item.decorator'));
  ({ Menu } = await import('../src/main/menu/decorators/menu.decorator'));
});

describe('@Menu auto bootstrap', () => {
  it('registers menu roots from declarative @MenuItem metadata', () => {
    @Menu({ window: 'main', name: 'mainMenu' })
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
    @Menu({ window: 'main', name: 'mainMenu' })
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
    @Menu({ window: 'main', name: 'mainMenu' })
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

  it('aggregates menu items from two provided @MenuFragment classes', () => {
    @MenuFragment()
    @Assemblage()
    class WindowFragment {
      @MenuItem({ id: 'window.refresh', path: 'Window', label: 'Refresh' })
      public refresh(): void {}
    }

    @MenuFragment()
    @Assemblage()
    class AppFragment {
      @MenuItem({ id: 'app.quit', path: 'App', label: 'Quit', role: 'quit' })
      public quit(): void {}
    }

    @Menu({ window: 'main', name: 'mainMenu' })
    @Assemblage({
      provide: [[WindowFragment], [AppFragment]],
    })
    class FragmentedMenu extends ElectronMenu {
      constructor() {
        super();
      }
    }

    const menu = new FragmentedMenu();

    expect(menu.itemById('window.refresh')?.label).toBe('Refresh');
    expect(menu.itemById('app.quit')?.label).toBe('Quit');
  });

  it('uses Menu.fragments class order for root menu ordering', () => {
    @MenuFragment()
    @Assemblage()
    class WindowFragment {
      @MenuItem({ id: 'window.refresh', path: 'Window', label: 'Refresh' })
      public refresh(): void {}
    }

    @MenuFragment()
    @Assemblage()
    class AppFragment {
      @MenuItem({ id: 'app.quit', path: 'App', label: 'Quit', role: 'quit' })
      public quit(): void {}
    }

    @Menu({
      window: 'main',
      name: 'mainMenu',
      fragments: [AppFragment, WindowFragment],
    })
    @Assemblage({
      provide: [[WindowFragment], [AppFragment]],
    })
    class OrderedFragmentedMenu extends ElectronMenu {
      constructor() {
        super();
      }
    }

    const menu = new OrderedFragmentedMenu();

    expect(menu.getItems().map((item) => item.id)).toEqual([
      'menu.app',
      'menu.window',
    ]);
  });

  it('uses MenuFragment path fallback when provided and MenuItem path is omitted', () => {
    @MenuFragment({ path: 'Window' })
    @Assemblage()
    class WindowFragment {
      @MenuItem({ id: 'window.refresh', label: 'Refresh' })
      public refresh(): void {}
    }

    @Menu({ window: 'main', name: 'mainMenu' })
    @Assemblage({
      provide: [[WindowFragment]],
    })
    class FragmentedMenu extends ElectronMenu {
      constructor() {
        super();
      }
    }

    const menu = new FragmentedMenu();

    expect(menu.getItems().map((item) => item.id)).toEqual(['menu.window']);
    expect(menu.itemById('window.refresh')?.label).toBe('Refresh');
  });

  it('throws on duplicate leaf ids across fragments in strict composition', () => {
    @MenuFragment()
    @Assemblage()
    class FirstFragment {
      @MenuItem({ id: 'dup.item', path: 'Window', label: 'One' })
      public one(): void {}
    }

    @MenuFragment()
    @Assemblage()
    class SecondFragment {
      @MenuItem({ id: 'dup.item', path: 'Window', label: 'Two' })
      public two(): void {}
    }

    @Menu({ window: 'main', name: 'mainMenu' })
    @Assemblage({
      provide: [[FirstFragment], [SecondFragment]],
    })
    class InvalidFragmentedMenu extends ElectronMenu {
      constructor() {
        super();
      }
    }

    expect(() => new InvalidFragmentedMenu()).toThrow(
      "Duplicate menu item id 'dup.item'",
    );
  });
});
