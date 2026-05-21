import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAllWindows = vi.fn();

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

describe('ElectronWindow.getBounds IPC handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes bounds lookup by window name', async () => {
    const boundsAlpha = { x: 10, y: 20, width: 800, height: 600 };
    const boundsBeta = { x: 100, y: 200, width: 1024, height: 768 };

    getAllWindows.mockReturnValue([
      {
        name: 'alpha',
        isDestroyed: () => false,
        getBounds: () => boundsAlpha,
      },
      {
        name: 'beta',
        isDestroyed: () => false,
        getBounds: () => boundsBeta,
      },
    ]);

    const { ElectronWindow } =
      await import('../src/main/window/classes/electron-window');

    const result = await ElectronWindow.prototype.onGetBounds.call({}, 'beta');

    expect(result).toEqual({ data: boundsBeta, err: null });
  });

  it('returns an error when the named window does not exist', async () => {
    getAllWindows.mockReturnValue([]);

    const { ElectronWindow } =
      await import('../src/main/window/classes/electron-window');

    const result = await ElectronWindow.prototype.onGetBounds.call(
      {},
      'missing',
    );

    expect(result.data).toBeNull();
    expect(result.err).toBeInstanceOf(Error);
    expect(result.err?.message).toContain(
      "Window not found: missing in 'onGetBounds'",
    );
  });
});
