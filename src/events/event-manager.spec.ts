import { describe, expect, it, vi } from 'vitest';

import { EventManager } from './event-manager';

describe('EventManager', () => {
  it('should instantiate a `Mediator`, register listeners and emit.', () => {
    const receivedFoo = (result: string) => expect(result).toBe('bar');
    const receivedAsyncFoo = async (result: string): Promise<void> => {
      return new Promise((resolve) => {
        expect(result).toBe('bar');
        resolve();
      });
    };

    let receivedBarCalls = 0;
    const receivedBar = (result: string) => {
      receivedBarCalls++;
      expect(result).toBe('ack');
    };

    const manager = new EventManager('foo', 'bar');

    manager.on('foo', receivedFoo);
    manager.on('foo', receivedAsyncFoo);

    manager.emit('foo', 'bar');

    manager.once('bar', receivedBar);
    manager.emit('bar', 'ack');
    manager.emit('bar', 'ack');

    // Listener has been deleted after first call.
    expect(receivedBarCalls).toBe(1);

    const callbacks = {
      receivedAll: (result: string) =>
        expect(['bar', 'ack'].includes(result)).toBeTruthy(),
    };

    const spy = vi.spyOn(callbacks, 'receivedAll');

    manager.on('*', callbacks.receivedAll);

    manager.emit('foo', 'bar');
    manager.emit('bar', 'ack');

    expect(spy).toHaveBeenCalledTimes(2);
  });
});
