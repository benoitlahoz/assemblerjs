import 'reflect-metadata';
import { afterEach, expect, it, vi } from 'vitest';
import type { ElectronWindow } from '../../../packages/electron/src/window/main/classes/electron-window';

vi.mock('electron', async () => {
  const { EventEmitter } = await import('node:events');
  return {
    app: new EventEmitter(),
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

vi.mock('@assemblerjs/electron', async () => ({
  AbstractWindowController: class {},
  ElectronWindow: (
    await import('../../../packages/electron/src/window/main/classes/electron-window')
  ).ElectronWindow,
  ...(await import('../../../packages/electron/src/app/main/app-listener.decorator')),
  ...(await import('../../../packages/electron/src/app/main/app-on.decorator')),
  ...(await import('../../../packages/electron/src/menu/main/menu-item/menu-item.decorator')),
  ...(await import('../../../packages/electron/src/menu/main/menu-lifecycle')),
  ...(await import('../../../packages/electron/src/menu/main/builders/create-menu-item')),
}));

vi.mock('../src/menus/menu.controller', async () => ({
  MenuController: (
    await import('../../../packages/electron/src/menu/main/services/menu-controller.service')
  ).BaseMenuController,
}));

const { app, Menu } = await import('electron');
const { BaseMenuController } =
  await import('../../../packages/electron/src/menu/main/services/menu-controller.service');
const { ElectronMenu } =
  await import('../../../packages/electron/src/menu/main/model/electron-menu');
const { MenuLifecycleEvent } =
  await import('../../../packages/electron/src/menu/main/menu-lifecycle');
const { buildMenuTreeFromMetadata } =
  await import('../../../packages/electron/src/menu/main/builders/menu-tree');
const { Assembler, getAssemblageContext } = await import('assemblerjs');
const { RecentFilesMenu } = await import('../src/menus/file/recent-files.menu');
const { FileMenu } = await import('../src/menus/file/file.menu');

class TestMenu extends ElectronMenu {}

afterEach(() => {
  vi.mocked(Menu.getApplicationMenu).mockReturnValue(null);
  app.removeAllListeners(MenuLifecycleEvent.Registered);
  const menus = new BaseMenuController();
  menus.unregisterMenu('1');
  menus.unregisterGlobalMenu();
  vi.restoreAllMocks();
});

it('adds a newly registered window and clears the displayed recent list', async () => {
  const { EventEmitter } = await import('node:events');
  const recentFiles = Assembler.build(RecentFilesMenu);
  const menus = new BaseMenuController();
  const context = getAssemblageContext(recentFiles.constructor);
  vi.spyOn(context, 'require').mockReturnValue(menus);
  const menu = new TestMenu();
  const fileMenu = new FileMenu({} as never, recentFiles);
  for (const root of buildMenuTreeFromMetadata(fileMenu).roots) {
    menu.registerItem(root);
  }
  expect(menu.itemById('menu.file.open.recent')).toBeDefined();
  await menus.registerGlobalMenu(menu);
  const window = Object.assign(new EventEmitter(), {
    id: 1,
    name: 'main',
    isDestroyed: () => false,
    webContents: { isDestroyed: () => true },
  }) as unknown as ElectronWindow;
  menus.registerMenu('main', menu, 'mainMenu', window);
  await menus.focus('1');
  vi.mocked(Menu.getApplicationMenu).mockImplementation(
    () => vi.mocked(Menu.setApplicationMenu).mock.calls.at(-1)?.[0] ?? null,
  );
  await (recentFiles as unknown as { pendingRefresh: Promise<void> }).pendingRefresh;

  expect(menu.itemById('file.openRecent.empty')).toBeUndefined();
  expect(menu.itemById('file.openRecent.window:1')).toBeDefined();
  expect(Menu.buildFromTemplate).toHaveBeenLastCalledWith([
    expect.objectContaining({
      submenu: expect.arrayContaining([
        expect.objectContaining({
          id: 'menu.file.open.recent',
          submenu: expect.arrayContaining([expect.objectContaining({ label: 'Window 1' })]),
        }),
      ]),
    }),
  ]);
  menu.itemById('file.openRecent.clear')?.click?.(undefined as never, undefined, undefined);
  await (recentFiles as unknown as { pendingRefresh: Promise<void> }).pendingRefresh;
  expect(menu.itemById('file.openRecent.window:1')).toBeUndefined();
  expect(Menu.buildFromTemplate).toHaveBeenLastCalledWith([
    expect.objectContaining({
      submenu: expect.arrayContaining([
        expect.objectContaining({
          id: 'menu.file.open.recent',
          submenu: [expect.objectContaining({ label: 'No recent windows' })],
        }),
      ]),
    }),
  ]);
  recentFiles.onDispose();
});
