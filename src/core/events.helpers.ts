import { EventManager } from '@/events/event-manager';

import type { Injectable } from './injectable';

/**
 * Register events channels if an Assemblage subclasses EventManager
 * and forward them to 'Assembler'.
 *
 * @param { Injectable<T> } injectable The injectable that built the 'instance'.
 * @param { T } instance The instance of an `Assemblage` that subclasses `EventManager`.
 */
export const registerEvents = <T>(injectable: Injectable<T>, instance: T) => {
  const isEventManager = injectable.concrete.prototype instanceof EventManager;
  if (isEventManager) {
    const eventManager: EventManager = instance as EventManager;
    const registeredChannels = eventManager.channels;
    for (const channel of injectable.events) {
      if (!registeredChannels.has(channel)) eventManager.addChannels(channel);
      if (!injectable.privateContext.events.has(channel))
        injectable.privateContext.addChannels(channel);
    }

    for (const channel of injectable.events) {
      (instance as EventManager).on(channel, (...args: any[]) => {
        injectable.privateContext.emit(channel, ...args);
      });
    }
  }
};

/**
 * Unregister events channels from an Assemblage that subclasses EventManager
 * and from the 'Assembler'.
 *
 * @param { Injectable<T> } injectable The injectable that built the 'instance'.
 * @param { T } instance The instance of an `Assemblage` that subclasses `EventManager`.
 */
export const unregisterEvents = <T>(injectable: Injectable<T>, instance: T) => {
  const isEventManager = injectable.concrete.prototype instanceof EventManager;
  if (isEventManager) {
    const eventManager: EventManager = instance as EventManager;

    for (const channel of injectable.events) {
      eventManager.off(channel);
    }
    eventManager.removeChannels(...injectable.events);
    injectable.privateContext.removeChannels(...injectable.events);
  }
};
