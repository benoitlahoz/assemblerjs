import 'reflect-metadata';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AbstractAssemblage,
  Assemblage,
  Assembler,
  Dispose,
} from 'assemblerjs';
import { IpcHandle, IpcOn } from '../src/universal/decorators';
import { WindowOn } from '../src/main/window';

const ipcMainOn = vi.fn();
const ipcMainOff = vi.fn();
const ipcMainHandle = vi.fn();
const ipcMainRemoveHandler = vi.fn();

vi.mock('electron', () => ({
  ipcMain: {
    on: ipcMainOn,
    off: ipcMainOff,
    handle: ipcMainHandle,
    removeHandler: ipcMainRemoveHandler,
  },
}));

describe('listener lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).window = {
      ipc: {
        channels: [],
        on: vi.fn(),
        handle: vi.fn(() => vi.fn()),
        once: vi.fn(),
        off: vi.fn(),
        removeHandler: vi.fn(),
        removeAllListeners: vi.fn(),
        send: vi.fn(),
        invoke: vi.fn(),
        emit: vi.fn(),
      },
    };
  });

  it('removes main ipc listeners on dispose', async () => {
    const { IpcListener } =
      await import('../src/main/ipc/ipc-listener.decorator');

    @IpcListener()
    @Assemblage()
    class MainModule implements AbstractAssemblage {
      public values: string[] = [];
      private disposeFunction!: () => Promise<void>;

      constructor(@Dispose() dispose: () => Promise<void>) {
        this.disposeFunction = dispose;
      }

      @IpcOn('main:ping')
      public onPing(value: string): void {
        this.values.push(value);
      }

      public async dispose(): Promise<void> {
        await this.disposeFunction();
      }
    }

    const module = Assembler.build(MainModule);

    expect(ipcMainOn).toHaveBeenCalledWith('main:ping', expect.any(Function));

    const registeredListener = ipcMainOn.mock.calls[0][1];
    registeredListener({ sender: 'main' }, 'pong');
    expect(module.values).toEqual(['pong']);

    await module.dispose();

    expect(ipcMainOff).toHaveBeenCalledWith('main:ping', registeredListener);
  });

  it('removes renderer ipc listeners on dispose', async () => {
    const { IpcListener } =
      await import('../src/renderer/ipc/decorators/ipc-listener.decorator');

    @IpcListener()
    @Assemblage()
    class RendererModule implements AbstractAssemblage {
      public values: string[] = [];
      private disposeFunction!: () => Promise<void>;

      constructor(@Dispose() dispose: () => Promise<void>) {
        this.disposeFunction = dispose;
      }

      @IpcOn('renderer:ping')
      public onPing(value: string): void {
        this.values.push(value);
      }

      public async dispose(): Promise<void> {
        await this.disposeFunction();
      }
    }

    const module = Assembler.build(RendererModule);
    const onMock = window.ipc.on as ReturnType<typeof vi.fn>;
    const offMock = window.ipc.off as ReturnType<typeof vi.fn>;

    expect(onMock).toHaveBeenCalledWith('renderer:ping', expect.any(Function));

    const registeredListener = onMock.mock.calls[0][1];
    await registeredListener('pong');
    expect(module.values).toEqual(['pong']);

    await module.dispose();

    expect(offMock).toHaveBeenCalledWith('renderer:ping', registeredListener);
  });

  it('removes renderer ipc handlers on dispose', async () => {
    const { IpcListener } =
      await import('../src/renderer/ipc/decorators/ipc-listener.decorator');

    @IpcListener()
    @Assemblage()
    class RendererRpcModule implements AbstractAssemblage {
      private disposeFunction!: () => Promise<void>;

      constructor(@Dispose() dispose: () => Promise<void>) {
        this.disposeFunction = dispose;
      }

      @IpcHandle('renderer:rpc')
      public async onRequest(payload: string): Promise<string> {
        return payload;
      }

      public async dispose(): Promise<void> {
        await this.disposeFunction();
      }
    }

    const module = Assembler.build(RendererRpcModule);
    const handleMock = window.ipc.handle as ReturnType<typeof vi.fn>;
    const removeHandlerMock = window.ipc.removeHandler as ReturnType<
      typeof vi.fn
    >;

    expect(handleMock).toHaveBeenCalledWith(
      'renderer:rpc',
      expect.any(Function),
    );

    await module.dispose();

    expect(removeHandlerMock).toHaveBeenCalledWith('renderer:rpc');
  });

  it('removes window listeners on dispose', async () => {
    const { WindowListener } = await import('../src/main/window');

    const onMock = vi.fn();
    const onceMock = vi.fn();
    const removeListenerMock = vi.fn();

    @WindowListener()
    @Assemblage()
    class WindowModule implements AbstractAssemblage {
      public values: string[] = [];
      private disposeFunction!: () => Promise<void>;
      public on = onMock;
      public once = onceMock;
      public removeListener = removeListenerMock;

      constructor(@Dispose() dispose: () => Promise<void>) {
        this.disposeFunction = dispose;
      }

      @WindowOn('resize')
      public onResize(value: string): void {
        this.values.push(value);
      }

      public async dispose(): Promise<void> {
        await this.disposeFunction();
      }
    }

    const module = Assembler.build(WindowModule);

    expect(onMock).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(onceMock).toHaveBeenCalledWith('closed', expect.any(Function));

    const registeredListener = onMock.mock.calls[0][1];
    registeredListener('moved');
    expect(module.values).toEqual(['moved']);

    await module.dispose();

    expect(removeListenerMock).toHaveBeenCalledWith(
      'resize',
      registeredListener,
    );
  });
});
