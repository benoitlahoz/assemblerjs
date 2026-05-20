import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const exposeInMainWorld = vi.fn();
const on = vi.fn();
const once = vi.fn();
const off = vi.fn();
const removeAllListeners = vi.fn();
const send = vi.fn();
const invoke = vi.fn();

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld,
  },
  ipcRenderer: {
    on,
    once,
    off,
    removeAllListeners,
    send,
    invoke,
  },
}));

describe('preload bridge', () => {
  const originalContextIsolated = process.contextIsolated;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    Object.defineProperty(process, 'contextIsolated', {
      value: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(process, 'contextIsolated', {
      value: originalContextIsolated,
      configurable: true,
    });
  });

  it('exposes the official electron and ipc globals on import', async () => {
    await import('../src/preload');

    expect(exposeInMainWorld).toHaveBeenCalledWith(
      'ipc',
      expect.objectContaining({
        channels: expect.arrayContaining([
          'window:bounds.get',
          'menu:item.clicked',
        ]),
        on: expect.any(Function),
        once: expect.any(Function),
        off: expect.any(Function),
        removeAllListeners: expect.any(Function),
        send: expect.any(Function),
        invoke: expect.any(Function),
      })
    );
  });

  it('strips the electron event object and unregisters the wrapped listener', async () => {
    const { createIpcBridge } = await import('../src/preload');
    const bridge = createIpcBridge(['custom:channel']);
    const listener = vi.fn();

    bridge.on('custom:channel', listener);

    const wrappedListener = on.mock.calls[0][1];
    wrappedListener({ sender: 'ipcRenderer' }, 'payload', 42);

    expect(listener).toHaveBeenCalledWith('payload', 42);

    bridge.off('custom:channel', listener);

    expect(off).toHaveBeenCalledWith('custom:channel', wrappedListener);
  });
});
