import {
  clearInstance,
  forOf,
  isAsync,
  onlyAlphanumeric,
} from '@/common/utils';
import type { Listener } from './listener-collection';
import { ListenerCollection } from './listener-collection';
import { AbstractEventManager } from './event-manager.abstract';

export class EventManager implements AbstractEventManager {
  private readonly listeners: ListenerCollection = new ListenerCollection();
  private readonly onceListeners: ListenerCollection = new ListenerCollection();

  private readonly channels: Set<string> = new Set(['*']);

  constructor(...allowedChannels: string[]) {
    this.addChannels(...allowedChannels);
  }

  public dispose(): void {
    this.listeners.dispose();
    this.channels.clear();
    clearInstance(this, EventManager);
  }

  public addChannels(...channels: string[]): EventManager {
    const iterateChannels = forOf(channels);

    iterateChannels((channel: string) => {
      const clean = this.cleanChannel(channel);

      if (this.channels.has(clean)) {
        throw new Error(`Channel '${clean}' already exists.`);
      }
      this.channels.add(clean);
    });

    return this;
  }

  public removeChannels(...channels: string[]): EventManager {
    const iterateChannels = forOf(channels);

    iterateChannels((channel: string) => {
      const clean = this.cleanChannel(channel);

      if (clean !== '*' && this.channels.has(clean)) {
        this.channels.delete(clean);
        this.listeners.remove(clean);
        this.onceListeners.remove(clean);
      }
    });

    return this;
  }

  public on(channel: string, callback: Listener): EventManager {
    const clean = this.cleanChannel(channel);

    if (!this.channels.has(clean)) {
      throw new Error(`Channel '${clean}' was not registered.`);
    }

    this.listeners.add(clean, callback);

    return this;
  }

  public once(channel: string, callback: Listener): EventManager {
    const clean = this.cleanChannel(channel);

    if (!this.channels.has(clean)) {
      throw new Error(`Channel '${clean}' was not registered.`);
    }

    this.onceListeners.add(clean, callback);

    return this;
  }

  public off(channel: string, callback?: Listener): EventManager {
    const clean = this.cleanChannel(channel);
    // Listeners collection will fail silently if channel does not exist.
    this.listeners.remove(clean, callback);
    return this;
  }

  public emit(channel: string, ...args: any[]): EventManager {
    const clean = this.cleanChannel(channel);

    // Will fail silently if channel is not authorized.

    if (this.channels.has(clean)) {
      const onceAll = this.onceListeners.get('*') || [];
      const listenersAll = this.listeners.get('*') || [];
      const once = this.onceListeners.get(clean) || [];
      const listeners = this.listeners.get(clean) || [];

      const iterateOnceAll = forOf(onceAll);
      const iterateListenersAll = forOf(listenersAll);
      const iterateOnce = forOf(once);
      const iterateListeners = forOf(listeners);

      iterateOnceAll((listener: Listener) => {
        this.run(listener, ...args);
        this.onceListeners.remove('*', listener);
      });

      iterateListenersAll((listener: Listener) => {
        this.run(listener, ...args);
      });

      iterateOnce((listener: Listener) => {
        this.run(listener, ...args);
        this.onceListeners.remove(clean, listener);
      });

      iterateListeners((listener: Listener) => {
        this.run(listener, ...args);
      });
    }

    return this;
  }

  private run(callback: Listener, ...args: any[]): void {
    if (isAsync(callback)) {
      const fn: Function = callback;
      return fn(...args).then(() => Promise.resolve());
    }
    callback(...args);
  }

  private cleanChannel(channel: string): string {
    return onlyAlphanumeric(channel, '*');
  }
}
