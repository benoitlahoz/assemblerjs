import { createConstructorDecorator } from 'assemblerjs';
import { getWindowMainSubscriptionMetadata } from '@/universal/metadata';
import { bindMainEventListeners } from '@/universal/runtime';
import { getWindowEmitEvent } from './window-emit.decorator';
import { buildWindowEventChannel } from './window-channels';

/**
 * @deprecated Backward compatibility token. Prefer metadata/runtime binders.
 */
export const WindowSubMethods = '__legacy:window-main-submethods__';

function getWindowSubMethods(target: Function): Map<string, string> {
  const entries = getWindowMainSubscriptionMetadata(target);
  const subMethods = new Map<string, string>();

  for (const entry of entries) {
    subMethods.set(entry.method, entry.channel);
  }

  return subMethods;
}

export const WindowListener = createConstructorDecorator(function (this: any) {
  const subMethods = getWindowSubMethods(this.constructor);
  if (subMethods.size > 0) {
    bindMainEventListeners(
      this,
      subMethods.entries(),
      (method: string, args: any[]) => {
        const emitEvent = getWindowEmitEvent(
          this.constructor.prototype,
          method,
        );
        const methodRef = this[method];

        if (typeof methodRef !== 'function') {
          return;
        }

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

        const result = methodRef.apply(this, args);
        if (emitEvent) {
          if (result && typeof result.then === 'function') {
            void result.then((payload: any) => emitResult(payload));
          } else {
            emitResult(result);
          }
        }

        return result;
      },
    );
  }
});
