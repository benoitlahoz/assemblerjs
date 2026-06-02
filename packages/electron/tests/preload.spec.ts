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

  it('exposes the ipc global when initialized', async () => {
    const { exposeIpcBridge } = await import('../src/preload');
    exposeIpcBridge();

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
      }),
    );
  });

  it('strips the electron event object and unregisters the wrapped listener', async () => {
    const { createIpcBridge } = await import('../src/preload');
    const bridge = createIpcBridge(['custom:channel']);
    const listener = vi.fn();

    bridge.on('custom:channel', listener);

    const wrappedListener = on.mock.calls[on.mock.calls.length - 1][1];
    wrappedListener({ sender: 'ipcRenderer' }, 'payload', 42);

    expect(listener).toHaveBeenCalledWith('payload', 42);

    bridge.off('custom:channel', listener);

    expect(off).toHaveBeenCalledWith('custom:channel', wrappedListener);
  });

  it('always includes package default channels when custom channels are provided', async () => {
    const { createIpcBridge } = await import('../src/preload');
    const bridge = createIpcBridge(['custom:channel']);

    expect(bridge.channels).toEqual(
      expect.arrayContaining([
        'custom:channel',
        'window:bounds.get',
        'menu:item.clicked',
      ]),
    );

    expect(() => bridge.send('window:bounds.get')).not.toThrow();
  });

  it('allows scoped menu channels through auto-whitelist in strict mode', async () => {
    const { createIpcBridge } = await import('../src/preload');
    const bridge = createIpcBridge([]);

    expect(() =>
      bridge.send('menu:main.setItemEnabled', 'save', false),
    ).not.toThrow();
  });
});
