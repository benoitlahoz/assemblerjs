import 'reflect-metadata';
import { Assemblage } from 'assemblerjs';
import { beforeAll, describe, expect, it, vi } from 'vitest';

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

vi.mock('../src/main/menu/classes/create-menu-item', () => ({
  createMenuItem(input: {
    id: string;
    label?: string;
    role?: string;
    type?: string;
    checked?: boolean;
    enabled?: boolean;
    accelerator?: string;
  }) {
    const item = {
      ...input,
      submenu: null,
      _handleInMain: undefined as
        | ((itemId: string, windowName: string) => void)
        | undefined,
      _forwardToRenderer: false,
      handleInMain(callback: (itemId: string, windowName: string) => void) {
        this._handleInMain = callback;
        return this;
      },
      forwardClickToRenderer() {
        this._forwardToRenderer = true;
        return this;
      },
    };

    return item;
  },
}));

let MenuItem: (options: {
  id: string;
  path: string;
  label?:
    | string
    | ((context: {
        translate: (key: string) => string;
        itemId: string;
      }) => string | undefined);
  role?: string;
  order?: number;
  before?: string;
  after?: string;
}) => MethodDecorator;

let HandleInMain: () => MethodDecorator;

let ForwardClickToRenderer: () => MethodDecorator;

let buildMenuTreeFromMetadata: (
  targetOrInstance: (new (...args: unknown[]) => object) | object,
) => {
  roots: Array<{ id: string; submenu?: Array<{ id: string }> }>;
  itemsById: Map<
    string,
    {
      id: string;
      label?: string;
      _handleInMain?: (itemId: string, windowName: string) => void;
      _forwardToRenderer?: boolean;
    }
  >;
};

beforeAll(async () => {
  ({ MenuItem } =
    await import('../src/main/menu/decorators/menu-item.decorator'));
  ({ HandleInMain } =
    await import('../src/main/menu/decorators/handle-in-main.decorator'));
  ({ ForwardClickToRenderer } =
    await import('../src/main/menu/decorators/forward-click-to-renderer.decorator'));
  ({ buildMenuTreeFromMetadata } =
    await import('../src/main/menu/classes/build-menu-tree-from-metadata'));
});

describe('buildMenuTreeFromMetadata', () => {
  it('builds root groups and leaf item map from MenuItem metadata', () => {
    @Assemblage()
    class MenuDef {
      @MenuItem({ id: 'app.quit', path: 'App', label: 'Quit', role: 'quit' })
      public quit(): void {}

      @MenuItem({
        id: 'main.window.centerWindow',
        path: 'Window',
        label: 'Center',
      })
      public center(): void {}
    }

    const built = buildMenuTreeFromMetadata(MenuDef);

    expect(built.roots.map((root) => root.id)).toEqual([
      'menu.app',
      'menu.window',
    ]);
    expect(built.itemsById.get('app.quit')?.label).toBe('Quit');
    expect(built.itemsById.get('main.window.centerWindow')?.label).toBe(
      'Center',
    );
  });

  it('applies deterministic order with order priority, then before/after anchors', () => {
    @Assemblage()
    class MenuDef {
      @MenuItem({ id: 'a', path: 'Window', label: 'A', order: 20 })
      public a(): void {}

      @MenuItem({ id: 'b', path: 'Window', label: 'B', order: 10 })
      public b(): void {}

      @MenuItem({ id: 'c', path: 'Window', label: 'C', after: 'b' })
      public c(): void {}
    }

    const built = buildMenuTreeFromMetadata(MenuDef);
    const windowRoot = built.roots.find((root) => root.id === 'menu.window');
    const ids = windowRoot?.submenu?.map((item) => item.id) || [];

    expect(ids).toEqual(['b', 'a', 'c']);
  });

  it('returns empty tree when no MenuItem metadata is declared', () => {
    @Assemblage()
    class EmptyMenu {}

    const built = buildMenuTreeFromMetadata(EmptyMenu);

    expect(built.roots).toEqual([]);
    expect(built.itemsById.size).toBe(0);
  });

  it('uses pathFallback when MenuItem path is omitted', () => {
    @Assemblage()
    class MenuDef {
      @MenuItem({ id: 'main.window.refresh', label: 'Refresh' })
      public refresh(): void {}
    }

    const built = buildMenuTreeFromMetadata(MenuDef, {
      pathFallback: 'Window',
    });

    expect(built.roots.map((root) => root.id)).toEqual(['menu.window']);
    expect(built.itemsById.get('main.window.refresh')?.label).toBe('Refresh');
  });

  it('throws when neither MenuItem path nor pathFallback is provided', () => {
    @Assemblage()
    class MenuDef {
      @MenuItem({ id: 'missing.path', label: 'No path' })
      public missingPath(): void {}
    }

    expect(() => buildMenuTreeFromMetadata(MenuDef)).toThrow(
      "@MenuItem('missing.path') requires a 'path' or a @MenuFragment({ path }) fallback.",
    );
  });

  it('translates group labels with menu.group.* keys', () => {
    @Assemblage()
    class MenuDef {
      @MenuItem({ id: 'app.quit', path: 'App', label: 'Quit' })
      public quit(): void {}

      @MenuItem({
        id: 'main.window.centerWindow',
        path: 'Window',
        label: 'Center',
      })
      public center(): void {}
    }

    const built = buildMenuTreeFromMetadata(MenuDef, {
      translate: (key: string) => {
        if (key === 'menu.group.app') return 'Application';
        if (key === 'menu.group.window') return 'Fenetre';
        return key;
      },
    });

    expect(built.roots.map((root) => root.label)).toEqual([
      'Application',
      'Fenetre',
    ]);
  });

  it('resolves function labels with translate context and bound source instance', () => {
    @Assemblage()
    class MenuDef {
      public readonly prefix = 'Menu';

      @MenuItem({
        id: 'localized.item',
        path: 'App',
        label(context) {
          return `${this.prefix}: ${context.translate('menu.app.quit')}`;
        },
      })
      public localized(): void {}
    }

    const instance = new MenuDef();

    const built = buildMenuTreeFromMetadata(instance, {
      translate: (key: string) => `tr:${key}`,
    });
    expect(built.itemsById.get('localized.item')?.label).toBe(
      'Menu: tr:menu.app.quit',
    );
  });

  it('wires HandleInMain and ForwardClickToRenderer from method decorators', () => {
    @Assemblage()
    class MenuDef {
      public calls: Array<{ itemId: string; windowName: string }> = [];

      @MenuItem({ id: 'main.menu.autoCenter', path: 'Window', label: 'Auto' })
      @HandleInMain()
      @ForwardClickToRenderer()
      public autoCenter(itemId: string, windowName: string): void {
        this.calls.push({ itemId, windowName });
      }
    }

    const instance = new MenuDef();
    const built = buildMenuTreeFromMetadata(instance);
    const item = built.itemsById.get('main.menu.autoCenter');

    expect(item?._forwardToRenderer).toBe(true);
    expect(typeof item?._handleInMain).toBe('function');

    item?._handleInMain?.('main.menu.autoCenter', 'main');
    expect(instance.calls).toEqual([
      { itemId: 'main.menu.autoCenter', windowName: 'main' },
    ]);
  });

  it('orders a nested submenu after a leaf item when subgroup entries have higher order', () => {
    @Assemblage()
    class MenuDef {
      @MenuItem({
        id: 'main.developer.toggleDevTools',
        path: 'Developer',
        label: 'Toggle DevTools',
        order: 10,
      })
      public toggleDevTools(): void {}

      @MenuItem({
        id: 'main.developer.reload',
        path: 'Developer/Refresh',
        label: 'Reload',
        order: 20,
      })
      public reload(): void {}

      @MenuItem({
        id: 'main.developer.forceReload',
        path: 'Developer/Refresh',
        label: 'Force Reload',
        order: 30,
      })
      public forceReload(): void {}
    }

    const built = buildMenuTreeFromMetadata(MenuDef);
    const developerRoot = built.roots.find(
      (root) => root.id === 'menu.developer',
    );
    const ids = developerRoot?.submenu?.map((item) => item.id) || [];

    expect(ids).toEqual([
      'main.developer.toggleDevTools',
      'menu.developer.refresh',
    ]);
  });
});
