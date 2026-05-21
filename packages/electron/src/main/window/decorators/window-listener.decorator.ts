import { createConstructorDecorator } from 'assemblerjs';
import { bindCleanupToEvent, registerCleanup } from '@/universal/lifecycle';
import { getWindowEmitEvent } from './window-emit.decorator';
import { buildWindowEventChannel } from './window-channels';

export const WindowSubMethods = Symbol('__WindowListenerSubMethods__');

function getWindowSubMethods(target: any): Map<string, string> | undefined {
  let prototype = target;

  while (prototype && prototype !== Object.prototype) {
    const subMethods: Map<string, string> | undefined =
      prototype[WindowSubMethods];
    if (subMethods) {
      return subMethods;
    }

    prototype = Object.getPrototypeOf(prototype);
  }

  return undefined;
}

export const WindowListener = createConstructorDecorator(function (this: any) {
  const subMethods = getWindowSubMethods(this.constructor.prototype);
  if (subMethods) {
    bindCleanupToEvent(this, 'closed');

    subMethods.forEach((channel: string, method: string) => {
      const emitEvent = getWindowEmitEvent(this.constructor.prototype, method);

      const emitResult = (payload: any): void => {
        if (!emitEvent || !this?.name || !this?.webContents?.send) {
          return;
        }

        const eventChannel = buildWindowEventChannel(this.name, emitEvent);
        if (typeof payload === 'undefined') {
          this.webContents.send(eventChannel);
        } else {
          this.webContents.send(eventChannel, payload);
        }
      };

      const listener = (...args: any[]) => {
        if (!this[method]) {
          return;
        }

        const result = this[method](...args);

        if (emitEvent) {
          if (result && typeof result.then === 'function') {
            void result.then((payload: any) => emitResult(payload));
          } else {
            emitResult(result);
          }
        }

        return result;
      };

      this.on(channel as any, listener);
      registerCleanup(this, () => {
        this.removeListener(channel as any, listener);
      });
    });
  }
});
