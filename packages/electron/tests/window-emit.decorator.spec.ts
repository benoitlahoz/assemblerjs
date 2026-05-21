import 'reflect-metadata';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Assemblage, Assembler } from 'assemblerjs';
import { WindowIpcChannel } from '../src/universal/channels';
import {
  WindowEmit,
  WindowListener,
  WindowOn,
} from '../src/main/window/decorators';

const ipcMainHandle = vi.fn();
const ipcMainRemoveHandler = vi.fn();

vi.mock('electron', () => ({
  ipcMain: {
    on: vi.fn(),
    once: vi.fn(),
    off: vi.fn(),
    handle: ipcMainHandle,
    removeHandler: ipcMainRemoveHandler,
  },
}));

describe('WindowEmit decorator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('emits canonical event channel from WindowOn handler return value', () => {
    const onMock = vi.fn();
    const onceMock = vi.fn();
    const removeListenerMock = vi.fn();
    const sendMock = vi.fn();

    @WindowListener()
    @Assemblage()
    class MainWindow {
      public name = 'main';
      public on = onMock;
      public once = onceMock;
      public removeListener = removeListenerMock;
      public webContents = { send: sendMock };

      @WindowOn('resize')
      @WindowEmit(WindowIpcChannel.OnBoundsChanged)
      public onResize() {
        return { width: 800, height: 600 };
      }
    }

    Assembler.build(MainWindow as any);

    const listener = onMock.mock.calls[0][1];
    listener();

    expect(sendMock).toHaveBeenCalledWith(WindowIpcChannel.OnBoundsChanged, {
      width: 800,
      height: 600,
    });
  });

  it('supports async payload emission', async () => {
    const onMock = vi.fn();
    const onceMock = vi.fn();
    const removeListenerMock = vi.fn();
    const sendMock = vi.fn();

    @WindowListener()
    @Assemblage()
    class MainWindow {
      public name = 'main';
      public on = onMock;
      public once = onceMock;
      public removeListener = removeListenerMock;
      public webContents = { send: sendMock };

      @WindowOn('move')
      @WindowEmit(WindowIpcChannel.OnBoundsChanged)
      public async onMove() {
        return { x: 10, y: 20 };
      }
    }

    Assembler.build(MainWindow as any);

    const listener = onMock.mock.calls[0][1];
    await listener();

    expect(sendMock).toHaveBeenCalledWith(WindowIpcChannel.OnBoundsChanged, {
      x: 10,
      y: 20,
    });
  });
});
