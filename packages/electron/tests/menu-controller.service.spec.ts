import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AssemblerContext } from 'assemblerjs';
import { AbstractIpcService } from '../src/renderer/ipc/services';
import { MenuIpcChannel } from '../src/universal/channels';
import type {
  IpcContractMap,
  KnownIpcChannel,
  MenuItemClickedEvent,
} from '../src/universal/types';
import { MenuControllerService } from '../src/renderer/menu/services';

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

describe('MenuControllerService', () => {
  let ipc: FakeIpcService;
  let service: MenuControllerService;

  beforeEach(() => {
    ipc = new FakeIpcService();
    service = new MenuControllerService(ipc as unknown as AbstractIpcService);
  });

  it('invokes scoped menu command for getSnapshot first', async () => {
    ipc.invokeMock.mockResolvedValueOnce({
      data: {
        windowName: 'main',
        menuName: 'mainMenu',
        items: {},
        updatedAt: 42,
      },
      err: null,
    });

    const result = await service.getSnapshot('main');

    expect(result?.windowName).toEqual('main');
    expect(ipc.invokeMock).toHaveBeenCalledWith('menu:main.snapshot');
  });

  it('falls back to global channel when scoped menu command fails', async () => {
    ipc.invokeMock
      .mockRejectedValueOnce(new Error('scoped handler not found'))
      .mockResolvedValueOnce({ data: true, err: null });

    const result = await service.setItemEnabled('main', 'save', false);

    expect(result).toBe(true);
    expect(ipc.invokeMock).toHaveBeenNthCalledWith(
      1,
      'menu:main.setItemEnabled',
      'save',
      false,
    );
    expect(ipc.invokeMock).toHaveBeenNthCalledWith(
      2,
      MenuIpcChannel.SetItemEnabled,
      'main',
      'save',
      false,
    );
  });

  it('receives click events from scoped and fallback channels', () => {
    const callback = vi.fn<(event: MenuItemClickedEvent) => void>();
    service.onItemClicked('main', callback);

    ipc.emit('menu:main.itemClicked', {
      itemId: 'open',
      windowName: 'main',
      timestampMs: 1,
    } satisfies MenuItemClickedEvent);

    ipc.emit(MenuIpcChannel.OnItemClicked, 'save', 'main');
    ipc.emit(MenuIpcChannel.OnItemClicked, 'save', 'secondary');

    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback.mock.calls[0]?.[0].itemId).toBe('open');
    expect(callback.mock.calls[1]?.[0].itemId).toBe('save');
  });
});
