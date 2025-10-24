import { BrowserWindow, webContents } from 'electron';
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
      if (!channel) {
        const channelParameters: number[] =
          Reflect.getMetadata('ipc-channel:parameters', target, propertyKey) ||
          [];

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

        channel = args[channelParameters[0]];
      }

      if (!channel || typeof channel !== 'string') {
        throw new Error(
          `@IpcSend on method '${String(
            propertyKey
          )}' requires a valid channel name. Got: ${channel}`
        );
      }

      const result = await originalMethod.apply(this, args);

      if (name) {
        const contents = webContents.getAllWebContents();

        const win = contents.find((content) => {
          const win = BrowserWindow.fromWebContents(content);
          return win && (win as ElectronWindow).name === name;
        }) as ElectronWindow | undefined;

        if (win) {
          win.webContents.send(channel, result);
        }
      } else {
        // Send to all windows if no name is specified
        const webContentsList = webContents.getAllWebContents();
        for (const wc of webContentsList) {
          wc.send(channel, result);
        }
      }

      return result;
    };
    return descriptor;
  };
};
