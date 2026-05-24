import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AssemblerContext } from 'assemblerjs';
import { AbstractIpcService } from '../src/renderer/ipc/services';
import { WindowIpcChannel } from '../src/universal/channels';
import type {
  IpcContractMap,
  KnownIpcChannel,
  WindowBounds,
} from '../src/universal/types';
import { WindowControllerService } from '../src/renderer/window/services/window-controller.service';

class FakeIpcService extends AbstractIpcService<IpcContractMap> {
  public readonly channels: ReadonlyArray<KnownIpcChannel<IpcContractMap>> = [];
  public readonly invokeMock = vi.fn<(...args: any[]) => Promise<any>>();
  private readonly listeners = new Map<string, Set<(...args: any[]) => void>>();

  public on(channel: string, listener: (...args: any[]) => void): () => void {
    const entries = this.listeners.get(channel) || new Set();
    entries.add(listener);
    this.listeners.set(channel, entries);

    return () => {
      entries.delete(listener);
      if (entries.size === 0) {
        this.listeners.delete(channel);
      }
    };
  }

  public once(channel: string, listener: (...args: any[]) => void): () => void {
    const dispose = this.on(channel, (...args: any[]) => {
      dispose();
      listener(...args);
    });

    return dispose;
  }

  public off(channel: string, listener: (...args: any[]) => void): void {
    const entries = this.listeners.get(channel);
    entries?.delete(listener);
  }

  public removeAllListeners(channel: string): void {
    this.listeners.delete(channel);
  }

  public send(channel: string, ...args: any[]): void {
    const entries = this.listeners.get(channel);
    if (!entries) {
      return;
    }

    for (const listener of entries) {
      listener(...args);
    }
  }

  public async invoke(channel: string, ...args: any[]): Promise<any> {
    return await this.invokeMock(channel, ...args);
  }

  public emit(channel: string, ...args: any[]): void {
    this.send(channel, ...args);
  }

  public onDispose(
    _context: AssemblerContext,
    _configuration?: Record<string, any>,
  ): void {}
}

describe('WindowControllerService', () => {
  let ipc: FakeIpcService;
  let service: WindowControllerService;

  beforeEach(() => {
    ipc = new FakeIpcService();
    service = new WindowControllerService(ipc as unknown as AbstractIpcService);
  });

  it('invokes scoped window command for getBounds first', async () => {
    const expectedBounds: WindowBounds = {
      x: 10,
      y: 20,
      width: 300,
      height: 400,
    };

    ipc.invokeMock.mockResolvedValueOnce({ data: expectedBounds, err: null });

    const result = await service.getBounds('main');

    expect(result).toEqual(expectedBounds);
    expect(ipc.invokeMock).toHaveBeenCalledWith('window:main.getBounds');
  });

  it('falls back to legacy channel when scoped command fails', async () => {
    const expectedBounds: WindowBounds = {
      x: 1,
      y: 2,
      width: 3,
      height: 4,
    };

    ipc.invokeMock
      .mockRejectedValueOnce(new Error('scoped handler not found'))
      .mockResolvedValueOnce({ data: expectedBounds, err: null });

    const result = await service.getBounds('main');

    expect(result).toEqual(expectedBounds);
    expect(ipc.invokeMock).toHaveBeenNthCalledWith(1, 'window:main.getBounds');
    expect(ipc.invokeMock).toHaveBeenNthCalledWith(
      2,
      WindowIpcChannel.GetBounds,
      'main',
    );
  });

  it('updates snapshot on bounds changed events', () => {
    const callback = vi.fn();

    service.onBoundsChanged('main', callback);
    ipc.emit(WindowIpcChannel.OnBoundsChanged, {
      x: 5,
      y: 6,
      width: 7,
      height: 8,
    } satisfies WindowBounds);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(service.snapshot('main')?.bounds).toEqual({
      x: 5,
      y: 6,
      width: 7,
      height: 8,
    });
  });
});
