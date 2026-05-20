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
  const unsubscribeOn = vi.fn();
  const unsubscribeOnce = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (globalThis as any).window = {
      ipc: {
        versions: { electron: 'test' },
        channels: ['window:bounds.get', 'window:bounds.changed'],
        ipc: {
          on: vi.fn(() => unsubscribeOn),
          once: vi.fn(() => unsubscribeOnce),
          off,
          removeAllListeners,
          send,
          invoke,
        },
      },
    };
  });

  it('is buildable as an assemblage and disposes only tracked subscriptions', () => {
    const service = Assembler.build(IpcService);

    service.on('window:bounds.get', vi.fn());
    service.once('window:bounds.changed', vi.fn());
    service.onDispose();

    expect(unsubscribeOn).toHaveBeenCalledTimes(1);
    expect(unsubscribeOnce).toHaveBeenCalledTimes(1);
    expect(removeAllListeners).not.toHaveBeenCalled();
  });
});
