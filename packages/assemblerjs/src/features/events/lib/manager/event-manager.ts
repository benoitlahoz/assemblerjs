import {
  clearInstance,
  forOf,
  isAsync,
  onlyAlphanumeric,
} from '@assemblerjs/core';

import { AbstractEventManager } from './event-manager.abstract';
import { ListenerCollection } from '../collection/listener-collection';

import type { Listener } from '../collection/listener-collection.abstract';
export class EventManager implements AbstractEventManager {
  private readonly listeners: ListenerCollection = new ListenerCollection();
  private readonly onceListeners: ListenerCollection = new ListenerCollection();
  private readonly channelCache: Map<string, string> = new Map();

  public readonly channels: Set<string> = new Set(['*']);

  constructor(...allowedChannels: string[]) {
    this.addChannels(...allowedChannels);
  }

  public dispose(): void {
    this.listeners.dispose();
    this.channels.clear();
    this.channelCache.clear();
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
    this.listeners.add(clean, callback);

    return this;
  }

  public once(channel: string, callback: Listener): EventManager {
    const clean = this.cleanChannel(channel);
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
    if (!this.channels.has(clean)) {
      return this;
    }

    // Optimized: Single iteration over all listeners
    const allListeners = [
      ...(this.onceListeners.get('*') || []).map(l => ({ listener: l, once: true, channel: '*' as const })),
      ...(this.listeners.get('*') || []).map(l => ({ listener: l, once: false, channel: '*' as const })),
      ...(this.onceListeners.get(clean) || []).map(l => ({ listener: l, once: true, channel: clean })),
      ...(this.listeners.get(clean) || []).map(l => ({ listener: l, once: false, channel: clean })),
    ];

    for (const { listener, once, channel: ch } of allListeners) {
      this.run(listener, ...args);
      if (once) {
        this.onceListeners.remove(ch, listener);
      }
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
    // Cache cleaned channels to avoid repeated string operations
    if (this.channelCache.has(channel)) {
      return this.channelCache.get(channel)!;
    }
    const clean = onlyAlphanumeric(channel, '*', ':', '.', '-', '_');
    this.channelCache.set(channel, clean);
    return clean;
  }
}
