import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { Assemblage } from 'assemblerjs';
import {
  MenuItem,
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
});
