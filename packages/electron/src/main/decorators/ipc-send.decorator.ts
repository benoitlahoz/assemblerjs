import { BrowserWindow } from 'electron';
import { type ElectronWindow } from '@/main';

/**
 * Method decorator to send an IPC message from the main process.
 * Usage:
 *   @IpcSend('my-channel')
 *   sendSomething(...args) { ... }
 */
export const IpcSend = (channel?: string, name?: string): MethodDecorator => {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    if (typeof originalMethod !== 'function') {
      throw new Error('@IpcSend can only be applied to methods.');
    }

    descriptor.value = async function (...args: any[]) {
      const channelParameters: number[] =
        Reflect.getMetadata('ipc-channel:parameters', target, propertyKey) || [];

      let resolvedChannel = channel;
      if (!resolvedChannel) {
        if (channelParameters.length === 0) {
          throw new Error(
            `@IpcSend on method '${String(
              propertyKey
            )}' requires a channel name or a parameter decorated with @IpcChannel.`
          );
        }

        if (channelParameters.length > 1) {
          throw new Error(
            `@IpcSend on method '${String(
              propertyKey
            )}' can only have one parameter decorated with @IpcChannel.`
          );
        }

        resolvedChannel = args[channelParameters[0]];
      }

      if (!resolvedChannel || typeof resolvedChannel !== 'string') {
        throw new Error(
          `@IpcSend on method '${String(
            propertyKey
          )}' requires a valid channel name. Got: ${resolvedChannel}`
        );
      }

      const result = await originalMethod.apply(this, args);
      const windows = BrowserWindow.getAllWindows().filter(
        (window) => !window.isDestroyed()
      ) as ElectronWindow[];

      if (name) {
        const win = windows.find((window) => window.name === name);

        if (win) {
          win.webContents.send(resolvedChannel, result);
        }
      } else {
        for (const window of windows) {
          window.webContents.send(resolvedChannel, result);
        }
      }

      return result;
    };
    return descriptor;
  };
};
