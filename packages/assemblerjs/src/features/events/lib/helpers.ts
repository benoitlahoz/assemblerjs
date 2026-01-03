import { AbstractInjectable } from '@/features/injectable';
import { EventManager } from './manager';

/**
 * Register events channels if an Assemblage subclasses EventManager
 * and forward them to 'Assembler', or register events in Assembler directly
 * if the assemblage is not an evebt manager.
 *
 * @param { AbstractInjectable<T> } injectable The injectable that built the 'instance'.
 * @param { T } instance The instance of an `Assemblage` that subclasses `EventManager`.
 */
export const registerEvents = <T>(
  injectable: AbstractInjectable<T>,
  instance: T
) => {
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
  } else {
    // Instance is not an EventManager: register events in context.
    for (const channel of injectable.events) {
      if (!injectable.privateContext.events.has(channel))
        injectable.privateContext.addChannels(channel);
    }
  }
};

/**
 * Unregister events channels from an Assemblage that subclasses EventManager
 * and from the 'Assembler', or unregister events in Assembler directly
 * if the assemblage is not an evebt manager.
 *
 * @param { AbstractInjectable<T> } injectable The injectable that built the 'instance'.
 * @param { T } instance The instance of an `Assemblage` that subclasses `EventManager`.
 */
export const unregisterEvents = <T>(
  injectable: AbstractInjectable<T>,
  instance: T
) => {
  const isEventManager = injectable.concrete.prototype instanceof EventManager;
  if (isEventManager) {
    const eventManager: EventManager = instance as EventManager;

    for (const channel of injectable.events) {
      eventManager.off(channel);
    }
    eventManager.removeChannels(...injectable.events);
    injectable.privateContext.removeChannels(...injectable.events);
  } else {
    for (const channel of injectable.events) {
      if (injectable.privateContext.events.has(channel)) {
        injectable.privateContext.removeChannels(channel);
      }
    }
  }
};
