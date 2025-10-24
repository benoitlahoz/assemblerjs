import { ipcMain } from 'electron';
import { createConstructorDecorator } from 'assemblerjs';
import { type IpcType, IpcSubMethods } from '@/universal/decorators';

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
        if (handler.type === ('handle' as IpcType)) {
          ipcMain.removeHandler(handler.channel as any);
        }

        if (!handler.withEvent) {
          ipcMain[handler.type](handler.channel as any, (...args: any[]) =>
            this[method](...args.slice(1))
          );
        } else {
          ipcMain[handler.type](handler.channel as any, (...args: any[]) =>
            this[method](...args)
          );
        }
      }
    );
  }
});
