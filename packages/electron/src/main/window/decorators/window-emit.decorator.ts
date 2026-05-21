import type { WindowIpcChannel } from '@/universal/channels';

export const WindowEmitMethods = Symbol('__WindowEmitMethods__');

export interface WindowEmitMetadata {
  method: string;
  event: string;
}

export function WindowEmit(event: WindowIpcChannel | string): MethodDecorator {
  return function (
    target: any,
    propertyKey: string,
    _descriptor: PropertyDescriptor,
  ) {
    target[WindowEmitMethods] = target[WindowEmitMethods] || new Map();
    target[WindowEmitMethods].set(propertyKey, event);
  } as MethodDecorator;
}

export function getWindowEmitEvent(
  target: any,
  method: string,
): string | undefined {
  let prototype = target;

  while (prototype && prototype !== Object.prototype) {
    const emitMethods: Map<string, string> | undefined =
      prototype[WindowEmitMethods];
    const event = emitMethods?.get(method);
    if (event) {
      return event;
    }

    prototype = Object.getPrototypeOf(prototype);
  }

  return undefined;
}

export function getWindowEmitEvents(target: Function): WindowEmitMetadata[] {
  const events = new Map<string, string>();

  let prototype: any = target.prototype;
  while (prototype && prototype !== Object.prototype) {
    const methods: Map<string, string> | undefined =
      prototype[WindowEmitMethods];
    if (methods) {
      for (const [method, event] of methods.entries()) {
        if (!events.has(method)) {
          events.set(method, event);
        }
      }
    }
    prototype = Object.getPrototypeOf(prototype);
  }

  return [...events.entries()].map(([method, event]) => ({ method, event }));
}
