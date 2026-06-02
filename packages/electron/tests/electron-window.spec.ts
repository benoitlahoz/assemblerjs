import 'reflect-metadata';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Assemblage, Assembler } from 'assemblerjs';
import { Window } from '../src/main/window';

const getAllWindows = vi.fn();
const webContentsSend = vi.fn();

vi.mock('electron', () => {
  class BrowserWindow {}

  return {
    BrowserWindow: Object.assign(BrowserWindow, {
      getAllWindows,
    }),
    screen: {
      getDisplayMatching: vi.fn(() => ({
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      })),
    },
  };
});

describe('ElectronWindow helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('finds an open window by name', async () => {
    const alpha = {
      name: 'alpha',
      isDestroyed: () => false,
      webContents: { send: webContentsSend },
    };
    const beta = {
      name: 'beta',
      isDestroyed: () => false,
      webContents: { send: webContentsSend },
    };

    getAllWindows.mockReturnValue([alpha, beta]);

    const { ElectronWindow } =
      await import('../src/main/window/classes/electron-window');

    expect(ElectronWindow.getByName('beta')).toBe(beta);
    expect(ElectronWindow.getByName('missing')).toBeUndefined();
  });

  it('broadcasts to all opened windows', async () => {
    const alphaSend = vi.fn();
    const betaSend = vi.fn();

    getAllWindows.mockReturnValue([
      {
        name: 'alpha',
        isDestroyed: () => false,
        webContents: { send: alphaSend },
      },
      {
        name: 'beta',
        isDestroyed: () => false,
        webContents: { send: betaSend },
      },
      {
        name: 'closed',
        isDestroyed: () => true,
        webContents: { send: vi.fn() },
      },
    ]);

    const { ElectronWindow } =
      await import('../src/main/window/classes/electron-window');

    ElectronWindow.sendAll('window:main.boundsChanged', { width: 800 });

    expect(alphaSend).toHaveBeenCalledWith('window:main.boundsChanged', {
      width: 800,
    });
    expect(betaSend).toHaveBeenCalledWith('window:main.boundsChanged', {
      width: 800,
    });
  });

  it('binds inherited window listeners on subclasses without auto-showing on ready-to-show', async () => {
    const onMock = vi.fn();
    const onceMock = vi.fn();
    const removeListenerMock = vi.fn();
    const showMock = vi.fn();

    getAllWindows.mockReturnValue([]);

    const { ElectronWindow } =
      await import('../src/main/window/classes/electron-window');

    @Window({ name: 'main' })
    @Assemblage()
    class MainWindow extends ElectronWindow {
      public on = onMock;
      public once = onceMock;
      public removeListener = removeListenerMock;
      public show = showMock;
      public getSize = vi.fn(() => [900, 670]);
      public setPosition = vi.fn();
      public getBounds = vi.fn(() => ({ x: 0, y: 0, width: 900, height: 670 }));
      public webContents = { send: vi.fn() };

      constructor() {
        super({
          webPreferences: {},
        });
      }
    }

    Assembler.build(MainWindow as any);

    expect(onMock).toHaveBeenCalledWith('ready-to-show', expect.any(Function));

    const readyToShowListener = onMock.mock.calls[0][1];
    readyToShowListener();

    expect(showMock).not.toHaveBeenCalled();
    expect(setPosition).toHaveBeenCalled();
  });
});
