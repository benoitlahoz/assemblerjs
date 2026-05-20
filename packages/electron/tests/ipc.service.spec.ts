import 'reflect-metadata';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Assembler } from 'assemblerjs';
import { IpcService } from '../src/renderer/services/ipc.service';

describe('IpcService', () => {
  const on = vi.fn();
  const once = vi.fn();
  const off = vi.fn();
  const removeAllListeners = vi.fn();
  const send = vi.fn();
  const invoke = vi.fn();
  const emit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (globalThis as any).window = {
      ipc: {
        versions: { electron: 'test' },
        channels: ['window:bounds.get', 'window:resize'],
        ipc: {
          on,
          once,
          off,
          removeAllListeners,
          send,
          invoke,
          emit,
        },
      },
    };
  });

  it('is buildable as an assemblage and disposes listeners by whitelisted channel', () => {
    const service = Assembler.build(IpcService);

    service.onDispose();

    expect(removeAllListeners).toHaveBeenCalledTimes(2);
    expect(removeAllListeners).toHaveBeenNthCalledWith(1, 'window:bounds.get');
    expect(removeAllListeners).toHaveBeenNthCalledWith(2, 'window:resize');
    expect(removeAllListeners).not.toHaveBeenCalledWith('*');
  });
});
