import { ipcMain } from 'electron';
import { createConstructorDecorator } from 'assemblerjs';
import { type IpcType, IpcSubMethods } from '@/universal/decorators';
import { registerCleanup } from '@/universal/lifecycle';

const activeHandleListeners = new Map<string, (...args: any[]) => any>();

/**
 * Class decorator to allow using 'ipcMain' decorators.
 * @see https://stackoverflow.com/a/61448736/1060921
 */
export const IpcListener = createConstructorDecorator(function (this: any) {
  // Since the class returned by this decorator is a wrapper of `Assemblage` get the constructor methods.
  const subMethods = this.constructor.prototype[IpcSubMethods];
  if (subMethods) {
    subMethods.forEach(
      (
        handler: { channel: string; type: IpcType; withEvent: boolean },
        method: string
      ) => {
        if (handler.type === 'handle') {
          ipcMain.removeHandler(handler.channel as any);
        }

        const listener = (...args: any[]) => {
          if (!handler.withEvent) {
            return this[method](...args.slice(1));
          }

          return this[method](...args);
        };

        if (handler.type === 'handle') {
          activeHandleListeners.set(handler.channel, listener);
          ipcMain.handle(handler.channel as any, listener);

          registerCleanup(this, () => {
            if (activeHandleListeners.get(handler.channel) === listener) {
              ipcMain.removeHandler(handler.channel as any);
              activeHandleListeners.delete(handler.channel);
            }
          });
        } else {
          ipcMain[handler.type](handler.channel as any, listener);
          registerCleanup(this, () => {
            ipcMain.off(handler.channel as any, listener);
          });
        }
      }
    );
  }
});
