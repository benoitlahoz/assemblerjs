import 'reflect-metadata';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IpcChannel } from '../src/universal/decorators';
import { RpcIpcChannel } from '../src/universal/channels';

const webContentsSend = vi.fn();
const ipcMainOn = vi.fn();
const getAllWindows = vi.fn(() => [
  {
    name: 'main',
    isDestroyed: () => false,
    webContents: {
      send: webContentsSend,
    },
  },
]);

vi.mock('electron', () => ({
  BrowserWindow: {
    fromWebContents: vi.fn(),
    getAllWindows,
  },
  ipcMain: {
    on: ipcMainOn,
  },
}));

describe('dynamic IPC channel decorators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    vi.resetModules();
    (globalThis as any).window = {
      ipc: {
        channels: [],
        send: vi.fn(),
        invoke: vi.fn(async (channel: string, payload: string) => ({
          channel,
          payload,
        })),
        on: vi.fn(),
        once: vi.fn(),
        off: vi.fn(),
        removeAllListeners: vi.fn(),
        emit: vi.fn(),
      },
    };
  });

  it('renderer IpcSend resolves the channel for each call', async () => {
    const { IpcSend: RendererIpcSend } =
      await import('../src/renderer/ipc/decorators/ipc-send.decorator');

    class RendererService {
      @RendererIpcSend()
      public notify(@IpcChannel() channel: string, payload: string): string {
        return payload;
      }
    }

    const service = new RendererService();

    service.notify('first:channel', 'alpha');
    service.notify('second:channel', 'beta');

    const sendMock = window.ipc.send as ReturnType<typeof vi.fn>;

    expect(sendMock).toHaveBeenNthCalledWith(1, 'first:channel', 'alpha');
    expect(sendMock).toHaveBeenNthCalledWith(2, 'second:channel', 'beta');
  });

  it('renderer IpcInvoke resolves the channel for each call', async () => {
    const { IpcInvoke } =
      await import('../src/renderer/ipc/decorators/ipc-invoke.decorator');

    class RendererService {
      @IpcInvoke()
      public async fetch(@IpcChannel() channel: string, payload: string) {
        return payload;
      }
    }

    const service = new RendererService();

    await service.fetch('first:invoke', 'alpha');
    await service.fetch('second:invoke', 'beta');

    const invokeMock = window.ipc.invoke as ReturnType<typeof vi.fn>;

    expect(invokeMock).toHaveBeenNthCalledWith(1, 'first:invoke', 'alpha');
    expect(invokeMock).toHaveBeenNthCalledWith(2, 'second:invoke', 'beta');
  });

  it('main IpcSend resolves the channel for each call', async () => {
    const { IpcSend: MainIpcSend } =
      await import('../src/main/ipc/ipc-send.decorator');

    class MainService {
      @MainIpcSend()
      public async publish(
        @IpcChannel() channel: string,
        payload: string,
      ): Promise<string> {
        return payload;
      }
    }

    const service = new MainService();

    await service.publish('main:first', 'alpha');
    await service.publish('main:second', 'beta');

    expect(webContentsSend).toHaveBeenNthCalledWith(1, 'main:first', 'alpha');
    expect(webContentsSend).toHaveBeenNthCalledWith(2, 'main:second', 'beta');
  });

  it('main IpcInvoke sends request envelope and waits for correlated response', async () => {
    const { IpcInvoke: MainIpcInvoke } =
      await import('../src/main/ipc/ipc-invoke.decorator');

    class MainService {
      @MainIpcInvoke('main:rpc', { name: 'main', timeoutMs: 1000 })
      public async query(payload: string): Promise<string> {
        return `done:${payload}`;
      }
    }

    const service = new MainService();
    const promise = service.query('alpha');

    expect(webContentsSend).toHaveBeenCalledWith(
      RpcIpcChannel.Request,
      expect.objectContaining({
        channel: 'main:rpc',
        args: ['alpha'],
      }),
    );

    const responseListener = ipcMainOn.mock.calls[0][1];
    const envelope = webContentsSend.mock.calls[0][1] as { requestId: string };

    responseListener(undefined, {
      requestId: envelope.requestId,
      ok: true,
      data: 'pong',
    });

    await expect(promise).resolves.toBe('done:alpha');
  });

  it('main IpcInvoke rejects when renderer responds with an error', async () => {
    const { IpcInvoke: MainIpcInvoke } =
      await import('../src/main/ipc/ipc-invoke.decorator');

    class MainService {
      @MainIpcInvoke('main:rpc', { name: 'main', timeoutMs: 1000 })
      public async query(payload: string): Promise<string> {
        return payload;
      }
    }

    const service = new MainService();
    const promise = service.query('alpha');

    const responseListener = ipcMainOn.mock.calls[0][1];
    const envelope = webContentsSend.mock.calls[0][1] as { requestId: string };

    responseListener(undefined, {
      requestId: envelope.requestId,
      ok: false,
      error: {
        name: 'RendererError',
        message: 'boom',
      },
    });

    await expect(promise).rejects.toThrow('boom');
  });

  it('main IpcInvoke rejects on timeout when renderer does not respond', async () => {
    vi.useFakeTimers();
    const { IpcInvoke: MainIpcInvoke } =
      await import('../src/main/ipc/ipc-invoke.decorator');

    class MainService {
      @MainIpcInvoke('main:rpc', { name: 'main', timeoutMs: 25 })
      public async query(payload: string): Promise<string> {
        return payload;
      }
    }

    const service = new MainService();
    const promise = service.query('alpha');

    await vi.advanceTimersByTimeAsync(30);

    await expect(promise).rejects.toThrow('Renderer RPC timeout');
  });
});
