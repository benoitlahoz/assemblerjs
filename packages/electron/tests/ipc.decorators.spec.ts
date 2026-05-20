import 'reflect-metadata';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IpcChannel } from '../src/universal/decorators';

const webContentsSend = vi.fn();
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
}));

describe('dynamic IPC channel decorators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).window = {
      ipc: {
        versions: {},
        channels: [],
        ipc: {
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
      },
    };
  });

  it('renderer IpcSend resolves the channel for each call', async () => {
    const { IpcSend: RendererIpcSend } = await import(
      '../src/renderer/decorators/ipc-send.decorator'
    );

    class RendererService {
      @RendererIpcSend()
      public notify(@IpcChannel() channel: string, payload: string): string {
        return payload;
      }
    }

    const service = new RendererService();

    service.notify('first:channel', 'alpha');
    service.notify('second:channel', 'beta');

    const sendMock = window.ipc.ipc.send as ReturnType<typeof vi.fn>;

    expect(sendMock).toHaveBeenNthCalledWith(1, 'first:channel', 'alpha');
    expect(sendMock).toHaveBeenNthCalledWith(2, 'second:channel', 'beta');
  });

  it('renderer IpcInvoke resolves the channel for each call', async () => {
    const { IpcInvoke } = await import(
      '../src/renderer/decorators/ipc-invoke.decorator'
    );

    class RendererService {
      @IpcInvoke()
      public async fetch(@IpcChannel() channel: string, payload: string) {
        return payload;
      }
    }

    const service = new RendererService();

    await service.fetch('first:invoke', 'alpha');
    await service.fetch('second:invoke', 'beta');

    const invokeMock = window.ipc.ipc.invoke as ReturnType<typeof vi.fn>;

    expect(invokeMock).toHaveBeenNthCalledWith(1, 'first:invoke', 'alpha');
    expect(invokeMock).toHaveBeenNthCalledWith(2, 'second:invoke', 'beta');
  });

  it('main IpcSend resolves the channel for each call', async () => {
    const { IpcSend: MainIpcSend } = await import(
      '../src/main/decorators/ipc-send.decorator'
    );

    class MainService {
      @MainIpcSend()
      public async publish(
        @IpcChannel() channel: string,
        payload: string
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
});