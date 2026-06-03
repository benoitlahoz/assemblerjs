import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { Assemblage } from 'assemblerjs';
import {
  MenuItem,
  SubMenu,
  getMenuItems,
  normalizeMenuItemDefinition,
  validateMenuItemMetadata,
} from '../src/main/menu/menu-item/menu-item.decorator';

describe('MenuItem decorator metadata foundations', () => {
  it('collects declarative menu item metadata from class methods', () => {
    @Assemblage()
    class MainMenu {
      @MenuItem({ id: 'a', path: 'Window', order: 10 })
      public a(): void {}

      @MenuItem({ id: 'b', path: 'Window', order: 20, after: 'a' })
      public b(): void {}
    }

    const items = getMenuItems(MainMenu);

    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'a', method: 'a', path: 'Window' }),
        expect.objectContaining({ id: 'b', method: 'b', after: 'a' }),
      ]),
    );
  });

  it('rejects invalid menu path definitions', () => {
    expect(() =>
      normalizeMenuItemDefinition({
        id: 'x',
        path: '   ',
      }),
    ).toThrow("@MenuItem requires a non-empty 'path'.");
  });

  it('accepts missing path metadata for fragment fallback resolution', () => {
    expect(
      normalizeMenuItemDefinition({
        id: 'x',
      }),
    ).toEqual(
      expect.objectContaining({
        id: 'x',
        path: undefined,
      }),
    );
  });

  it('rejects duplicate ids', () => {
    expect(() =>
      validateMenuItemMetadata([
        { method: 'first', id: 'dup', path: 'Window' },
        { method: 'second', id: 'dup', path: 'Window' },
      ]),
    ).toThrow("Duplicate @MenuItem id 'dup'");
  });

  it('rejects unknown anchors', () => {
    expect(() =>
      validateMenuItemMetadata([
        { method: 'first', id: 'a', path: 'Window', before: 'missing' },
      ]),
    ).toThrow("references unknown 'before' anchor 'missing'");
  });

  it('rejects ordering cycles', () => {
    expect(() =>
      validateMenuItemMetadata([
        { method: 'a', id: 'a', path: 'Window', after: 'b' },
        { method: 'b', id: 'b', path: 'Window', after: 'a' },
      ]),
    ).toThrow('Detected cycle in @MenuItem ordering constraints.');
  });

  it('supports DSL composition with class group + item + submenu without explicit paths', () => {
    @MenuItem('Recent')
    @Assemblage()
    class RecentMenu {
      @MenuItem({ id: 'file.recent.clear', label: 'Clear', order: 10 })
      public clear(): void {}
    }

    @MenuItem('File')
    @Assemblage()
    class FileMenu {
      @MenuItem({ id: 'file.open', label: 'Open', order: 5 })
      public open(): void {}

      @SubMenu('Recent')
      public recent = RecentMenu;
    }

    const items = getMenuItems(new FileMenu());

    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'file.open', path: 'File' }),
        expect.objectContaining({
          id: 'file.recent.clear',
          path: 'File/Recent',
        }),
      ]),
    );
  });

  it('supports @SubMenu({...}) method composition from injected submenu instance', () => {
    @MenuItem('Refresh')
    @Assemblage()
    class RefreshMenu {
      @MenuItem({ id: 'developer.reload', label: 'Reload', order: 10 })
      public reload(): void {}
    }

    @MenuItem('Developer')
    @Assemblage()
    class DeveloperMenu {
      constructor(public readonly refresh: RefreshMenu) {}

      @SubMenu({
        id: 'developer.refresh',
        label: 'Refresh',
        order: 10,
      })
      public refreshMenu(): RefreshMenu {
        return this.refresh;
      }
    }

    const items = getMenuItems(new DeveloperMenu(new RefreshMenu()));

    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'developer.reload',
          path: 'Developer/Refresh',
        }),
      ]),
    );
  });
});
