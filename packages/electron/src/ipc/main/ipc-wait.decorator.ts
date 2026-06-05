import { ipcMain, type IpcMainInvokeEvent } from 'electron';

/**
 * Method decorator that waits for a response from ipcMain.once(channel).
 * The decorated method will be called with the event and args when the response is received.
 * Usage:
 *   @IpcWait('my-channel')
 *   async myHandler(event, ...args) { ... }
 */
export const IpcWait = (channel: string): MethodDecorator => {
  return function (
    _target: any,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    if (typeof originalMethod !== 'function') {
      throw new Error('@IpcWait can only be applied to methods.');
    }

    descriptor.value = function (..._args: any[]) {
      ipcMain.removeHandler(channel);
      return new Promise((resolve) => {
        const eventHandler = async (
          _event: IpcMainInvokeEvent,
          ...ipcArgs: any[]
        ) => {
          try {
            const result = await originalMethod.apply(this, ipcArgs);
            resolve(result);
          } catch (err) {
            resolve(Promise.reject(err));
          }
        };
        ipcMain.handleOnce(channel, eventHandler);
      });
    };
    return descriptor;
  };
};
