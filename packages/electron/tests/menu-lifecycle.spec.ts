import 'reflect-metadata';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MenuRegisteredEvent } from '../src/menu/main/menu-lifecycle';
import type { ElectronWindow } from '../src/window/main/classes/electron-window';

vi.mock('electron', async () => {
  const { EventEmitter } = await import('node:events');
  return {
    app: new EventEmitter(),
    dialog: { showOpenDialog: vi.fn() },
    shell: { openPath: vi.fn(async () => '') },
    BrowserWindow: class {
      static getFocusedWindow = vi.fn(() => null);
      static getAllWindows = vi.fn(() => []);
    },
    ipcMain: { handle: vi.fn(), removeHandler: vi.fn() },
    Menu: {
      buildFromTemplate: vi.fn((items) => ({
        items,
        getMenuItemById: () => undefined,
      })),
      setApplicationMenu: vi.fn(),
      getApplicationMenu: vi.fn(() => null),
    },
  };
});

const { app, Menu } = await import('electron');
const { BaseMenuController } =
  await import('../src/menu/main/services/menu-controller.service');
const { ElectronMenu } = await import('../src/menu/main/model/electron-menu');
const { createMenuItem } =
  await import('../src/menu/main/builders/create-menu-item');
const { MenuLifecycleEvent } = await import('../src/menu/main/menu-lifecycle');
const { AppListener } = await import('../src/app/main/app-listener.decorator');
const { AppOn } = await import('../src/app/main/app-on.decorator');
const { MenuItem } =
  await import('../src/menu/main/menu-item/menu-item.decorator');
const { Assemblage, Assembler } = await import('assemblerjs');

class TestMenu extends ElectronMenu {}

function createRecentMenu(): TestMenu {
  const menu = new TestMenu();
  const parent = createMenuItem({ id: 'recent', label: 'Open Recent' });
  parent.replaceSubmenuItems([
    createMenuItem({ id: 'empty', label: 'No recent files', enabled: false }),
  ]);
  menu.registerItem(parent);
  return menu;
}

afterEach(() => {
  vi.mocked(Menu.getApplicationMenu).mockReturnValue(null);
  app.removeAllListeners(MenuLifecycleEvent.Registered);
  const menus = new BaseMenuController();
  menus.unregisterMenu('1');
  menus.unregisterMenu('2');
  menus.unregisterGlobalMenu();
  vi.clearAllMocks();
});

describe('Menu registration lifecycle', () => {
  it('does not activate an inactive window menu when its children change', async () => {
    const menus = new BaseMenuController();
    const first = createRecentMenu();
    const second = createRecentMenu();
    const window = { id: 1, name: 'main' } as ElectronWindow;
    menus.registerMenu('main', first, 'mainMenu', window);
    await first.focus();
    await second.focus();
    vi.mocked(Menu.getApplicationMenu).mockReturnValue(
      vi.mocked(Menu.buildFromTemplate).mock.results.at(-1)?.value,
    );
    vi.mocked(Menu.buildFromTemplate).mockClear();

    expect(
      await menus.replaceSubmenuItems(window, 'recent', [
        createMenuItem({ id: 'inactive.updated', label: 'Updated' }),
      ]),
    ).toBe(true);

    expect(first.itemById('inactive.updated')).toBeDefined();
    expect(Menu.buildFromTemplate).not.toHaveBeenCalled();
  });

  it('reapplies the displayed window menu when clearing without a focused window', async () => {
    const menus = new BaseMenuController();
    const window = {
      id: 1,
      name: 'main',
      isDestroyed: () => false,
      webContents: { isDestroyed: () => true },
    } as ElectronWindow;
    const menu = createRecentMenu();
    menus.registerMenu('main', menu, 'mainMenu', window);
    await menus.focus('1');
    const nativeMenu = vi
      .mocked(Menu.buildFromTemplate)
      .mock.results.at(-1)?.value;
    vi.mocked(Menu.getApplicationMenu).mockReturnValue(nativeMenu);
    vi.mocked(Menu.buildFromTemplate).mockClear();

    await menus.replaceSubmenuItems(window, 'recent', [
      createMenuItem({
        id: 'cleared',
        label: 'No recent windows',
        enabled: false,
      }),
    ]);

    expect(Menu.buildFromTemplate).toHaveBeenCalledWith([
      expect.objectContaining({
        submenu: [expect.objectContaining({ id: 'cleared' })],
      }),
    ]);
    vi.mocked(Menu.getApplicationMenu).mockReturnValue(null);
  });

  it('initializes dynamic items through a decorated menu listener', async () => {
    const menus = new BaseMenuController();
    let update: Promise<boolean> | undefined;

    @AppListener()
    @MenuItem('Open Recent')
    @Assemblage()
    class RecentMenu {
      @AppOn(MenuLifecycleEvent.Registered)
      onRegistered(event: MenuRegisteredEvent): void {
        update = menus.replaceSubmenuItems(event.window, 'recent', [
          createMenuItem({ id: 'decorated.recent', label: 'Document' }),
        ]);
      }
    }

    Assembler.build(RecentMenu);
    const menu = createRecentMenu();
    await menus.registerGlobalMenu(menu);

    expect(await update).toBe(true);
    expect(menu.itemById('decorated.recent')).toBeDefined();
  });

  it('allows a listener to populate a window menu as soon as it is registered', async () => {
    const menus = new BaseMenuController();
    const window = {
      id: 1,
      name: 'main',
      isDestroyed: () => false,
      webContents: { isDestroyed: () => true },
    } as ElectronWindow;
    const menu = createRecentMenu();
    let update: Promise<boolean> | undefined;
    const listener = vi.fn((event: MenuRegisteredEvent) => {
      update = menus.replaceSubmenuItems(event.window, 'recent', [
        createMenuItem({ id: 'recent.document', label: 'Document' }),
      ]);
    });
    app.on(MenuLifecycleEvent.Registered, listener);

    expect(menus.registerMenu('main', menu, 'mainMenu', window)).toBe(menus);

    expect(listener).toHaveBeenCalledWith({
      menu,
      menuName: 'mainMenu',
      window,
      windowName: 'main',
      global: false,
    });
    expect(await update).toBe(true);
    expect(menu.itemById('empty')).toBeUndefined();
    await menus.focus('1');
    expect(Menu.buildFromTemplate).toHaveBeenLastCalledWith([
      expect.objectContaining({
        id: 'recent',
        submenu: [expect.objectContaining({ id: 'recent.document' })],
      }),
    ]);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('allows a listener to populate the global fallback before its first focus', async () => {
    const menus = new BaseMenuController();
    const menu = createRecentMenu();
    let update: Promise<boolean> | undefined;
    const listener = vi.fn((event: MenuRegisteredEvent) => {
      update = menus.replaceSubmenuItems(event.window, 'recent', [
        createMenuItem({ id: 'recent.global', label: 'Global document' }),
      ]);
    });
    app.on(MenuLifecycleEvent.Registered, listener);

    await menus.registerGlobalMenu(menu);

    expect(listener).toHaveBeenCalledWith({
      menu,
      menuName: 'globalMenu',
      global: true,
    });
    expect(await update).toBe(true);
    expect(Menu.buildFromTemplate).toHaveBeenLastCalledWith([
      expect.objectContaining({
        submenu: [expect.objectContaining({ id: 'recent.global' })],
      }),
    ]);
  });

  it('notifies separately for windows sharing a name and for a replacement menu', () => {
    const menus = new BaseMenuController();
    const first = { id: 1, name: 'main' } as ElectronWindow;
    const second = { id: 2, name: 'main' } as ElectronWindow;
    const listener = vi.fn();
    app.on(MenuLifecycleEvent.Registered, listener);

    menus.registerMenu('main', createRecentMenu(), 'mainMenu', first);
    menus.registerMenu('main', createRecentMenu(), 'mainMenu', second);
    const replacement = createRecentMenu();
    menus.registerMenu('main', replacement, 'mainMenu', first);

    expect(listener).toHaveBeenCalledTimes(3);
    expect(listener.mock.calls[1][0].window).toBe(second);
    expect(listener.mock.calls[2][0].menu).toBe(replacement);
  });
});
