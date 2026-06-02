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
    return {
      ...input,
      submenu: null,
    };
  },
}));

let MenuItem: (options: {
  id: string;
  path: string;
  label?: string;
  role?: string;
  order?: number;
  before?: string;
  after?: string;
}) => MethodDecorator;

let buildMenuTreeFromMetadata: (target: new (...args: unknown[]) => object) => {
  roots: Array<{ id: string; submenu?: Array<{ id: string }> }>;
  itemsById: Map<string, { id: string; label?: string }>;
};

beforeAll(async () => {
  ({ MenuItem } =
    await import('../src/main/menu/decorators/menu-item.decorator'));
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
});
