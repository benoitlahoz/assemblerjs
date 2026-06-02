import 'reflect-metadata';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Assemblage, Assembler } from 'assemblerjs';

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

describe('MenuContribution decorator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('applies targeted menu contributions during menu controller initialization', async () => {
    const { ElectronMenu } = await import('../src/main/menu/classes/electron-menu');
    const { Menu } = await import('../src/main/menu/decorators/menu.decorator');
    const { MenuItem } = await import('../src/main/menu/decorators/menu-item.decorator');
    const { MenuContribution } = await import('../src/main/menu/decorators/menu-contribution.decorator');
    const { MenuController } = await import('../src/main/menu/decorators/menu-controller.decorator');

    @Menu({ window: 'main', name: 'appMenu' })
    @Assemblage()
    class AppMenu extends ElectronMenu {
      @MenuItem({ id: 'app.quit', path: 'App', label: 'Quit', order: 10 })
      public quit(): void {}
    }

    @MenuContribution({ target: 'appMenu', path: 'Help', priority: 10 })
    @Assemblage()
    class AboutContribution {
      @MenuItem({ id: 'about.open', label: 'About', order: 10 })
      public openAbout(): void {}
    }

    @MenuController()
    @Assemblage({ provide: [[AppMenu], [AboutContribution]] })
    class AppController {
      constructor(public readonly menu: AppMenu) {}
    }

    const controller = Assembler.build(AppController) as AppController & {
      onInit?: () => Promise<void>;
    };

    await controller.onInit?.();

    expect(controller.menu.itemById('about.open')?.label).toBe('About');
    expect(controller.menu.getItems().map((item) => item.id)).toEqual([
      'menu.app',
      'menu.help',
    ]);
  });

  it('ignores contributions targeting another menu name', async () => {
    const { ElectronMenu } = await import('../src/main/menu/classes/electron-menu');
    const { Menu } = await import('../src/main/menu/decorators/menu.decorator');
    const { MenuItem } = await import('../src/main/menu/decorators/menu-item.decorator');
    const { MenuContribution } = await import('../src/main/menu/decorators/menu-contribution.decorator');
    const { MenuController } = await import('../src/main/menu/decorators/menu-controller.decorator');

    @Menu({ window: 'main', name: 'appMenu' })
    @Assemblage()
    class AppMenu extends ElectronMenu {
      @MenuItem({ id: 'app.quit', path: 'App', label: 'Quit' })
      public quit(): void {}
    }

    @MenuContribution({ target: 'otherMenu', path: 'Help' })
    @Assemblage()
    class IgnoredContribution {
      @MenuItem({ id: 'about.open', label: 'About' })
      public openAbout(): void {}
    }

    @MenuController()
    @Assemblage({ provide: [[AppMenu], [IgnoredContribution]] })
    class AppController {
      constructor(public readonly menu: AppMenu) {}
    }

    const controller = Assembler.build(AppController) as AppController & {
      onInit?: () => Promise<void>;
    };

    await controller.onInit?.();

    expect(controller.menu.itemById('about.open')).toBeUndefined();
    expect(controller.menu.getItems().map((item) => item.id)).toEqual(['menu.app']);
  });
}
