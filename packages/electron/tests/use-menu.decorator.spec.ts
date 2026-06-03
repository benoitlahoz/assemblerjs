import 'reflect-metadata';
import { Assemblage } from 'assemblerjs';
import { describe, expect, it } from 'vitest';
import {
  getUseMenuDefinition,
  UseMenu,
} from '../src/main/window-menu/decorators/use-menu.decorator';
import { normalizeUseMenuDefinition } from '../src/main/window-menu/contracts';

class MainMenu {}
class MainMenuLayout {}
class MainMenuState {}

describe('UseMenu decorator and contracts', () => {
  it('normalizes a token reference', () => {
    const normalized = normalizeUseMenuDefinition(MainMenu);

    expect(normalized).toEqual({
      menu: MainMenu,
    });
  });

  it('normalizes an object definition with layout and state', () => {
    const normalized = normalizeUseMenuDefinition({
      menu: MainMenu,
      layout: MainMenuLayout,
      state: MainMenuState,
    });

    expect(normalized).toEqual({
      menu: MainMenu,
      layout: MainMenuLayout,
      state: MainMenuState,
    });
  });

  it('stores UseMenu metadata on a window class', () => {
    @UseMenu({
      menu: MainMenu,
      layout: MainMenuLayout,
      state: MainMenuState,
    })
    @Assemblage()
    class MainWindow {}

    expect(getUseMenuDefinition(MainWindow)).toEqual({
      menu: MainMenu,
      layout: MainMenuLayout,
      state: MainMenuState,
    });
  });

  it('rejects invalid menu references', () => {
    expect(() =>
      normalizeUseMenuDefinition({
        menu: 42 as unknown as string,
      }),
    ).toThrow(
      '@UseMenu requires a valid menu reference (token or string name).',
    );
  });
});
