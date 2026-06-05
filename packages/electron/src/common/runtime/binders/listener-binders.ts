import { bindCleanupToEvent, registerCleanup } from '@/common/lifecycle';

export function createEventDeduplicator(
  windowMs = 30,
  cleanupThreshold = 500,
  maxAgeMs = 5_000,
): (key: string) => boolean {
  const recent = new Map<string, number>();

  return (key: string): boolean => {
    const now = Date.now();
    const previous = recent.get(key);
    recent.set(key, now);

    if (previous !== undefined && now - previous <= windowMs) {
      return false;
    }

    if (recent.size > cleanupThreshold) {
      for (const [eventKey, ts] of recent.entries()) {
        if (now - ts > maxAgeMs) {
          recent.delete(eventKey);
        }
      }
    }

    return true;
  };
}

export function bindMainEventListeners(
  instance: {
    on: (channel: string, listener: (...args: any[]) => void) => void;
    removeListener: (
      channel: string,
      listener: (...args: any[]) => void,
    ) => void;
  },
  subscriptions: Iterable<[method: string, channel: string]>,
  invoke: (method: string, args: any[]) => any,
): void {
  bindCleanupToEvent(instance as any, 'closed');

  for (const [method, channel] of subscriptions) {
    const listener = (...args: any[]) => invoke(method, args);

    instance.on(channel, listener);
    registerCleanup(instance as any, () => {
      instance.removeListener(channel, listener);
    });
  }
}

export function bindRendererEventListeners(
  instance: object,
  bridge: {
    on: (channel: string, listener: (...args: any[]) => void) => void;
    once: (channel: string, listener: (...args: any[]) => void) => void;
    off: (channel: string, listener: (...args: any[]) => void) => void;
  },
  subscriptions: Array<{ method: string; event: string; type: 'on' | 'once' }>,
  resolveChannels: (event: string) => string[],
  invoke: (method: string, channel: string, args: any[]) => any,
): void {
  for (const sub of subscriptions) {
    const channels = resolveChannels(sub.event);
    const listenerByChannel = new Map<string, (...args: any[]) => any>();

    for (const channel of channels) {
      const listener = (...args: any[]) => invoke(sub.method, channel, args);
      listenerByChannel.set(channel, listener);
      bridge[sub.type](channel, listener);
    }

    registerCleanup(instance as any, () => {
      for (const channel of channels) {
        const listener = listenerByChannel.get(channel);
        if (listener) {
          bridge.off(channel, listener);
        }
      }
    });
  }
}
