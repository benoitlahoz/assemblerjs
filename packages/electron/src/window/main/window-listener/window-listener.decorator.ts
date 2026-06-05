import { createConstructorDecorator } from 'assemblerjs';
import { ElectronMetadata } from '@/common/metadata';
import { bindMainEventListeners } from '@/common/runtime';
import { getWindowEmitEventsForMethod } from './window-emit.decorator';
import { createChannelBuilder } from '@assemblerjs/common';

const buildWindowChannel = createChannelBuilder('window');

/**
 * @deprecated Backward compatibility token. Prefer metadata/runtime binders.
 */
export const WindowSubMethods = '__legacy:window-main-submethods__';

export const WindowListener = createConstructorDecorator(function (this: any) {
  const subscriptions = ElectronMetadata.window.getMainSubscriptions(
    this.constructor,
  );
  if (subscriptions.length > 0) {
    bindMainEventListeners(
      this,
      subscriptions.map((sub) => [sub.method, sub.channel] as [string, string]),
      (method: string, args: any[]) => {
        const emitEvents = getWindowEmitEventsForMethod(
          this.constructor,
          method,
        );
        const methodRef = this[method];

        if (typeof methodRef !== 'function') {
          return;
        }

        const emitResult = (payload: any): void => {
          if (
            emitEvents.length === 0 ||
            !this?.name ||
            !this?.webContents?.send
          ) {
            return;
          }

          for (const emitEvent of emitEvents) {
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
          }
        };

        const result = methodRef.apply(this, args);
        if (emitEvents.length > 0) {
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
