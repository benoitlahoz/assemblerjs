import { createConstructorDecorator } from 'assemblerjs';
import { ElectronMetadata } from '@/common/metadata';
import { bindMainEventListeners } from '@/common/runtime';
import { getWindowEmitEvent } from './window-emit.decorator';
import { createChannelBuilder } from '@assemblerjs/common';

const buildWindowChannel = createChannelBuilder('window');

/**
 * @deprecated Backward compatibility token. Prefer metadata/runtime binders.
 */
export const WindowSubMethods = '__legacy:window-main-submethods__';

function getWindowSubMethods(target: Function): Map<string, string> {
  const entries = ElectronMetadata.window.getMainSubscriptions(target);
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

          // If emitEvent contains ':', treat it as a full channel name (backward compatibility)
          // Otherwise, treat it as an event name and generate the channel
          const eventChannel = emitEvent.includes(':')
            ? emitEvent
            : buildWindowChannel(this.name, emitEvent);

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
