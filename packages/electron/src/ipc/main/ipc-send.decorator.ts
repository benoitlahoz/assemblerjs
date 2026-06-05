import { BrowserWindow, webContents } from 'electron';
import { type ElectronWindow } from '@/main';
import { ElectronMetadata } from '@/common/metadata';

/**
 * Sends an IPC message from the main process to renderer process(es).
 *
 * @template C The channel name for type-safe channel resolution
 * @param channel Optional channel name. If not provided, must be resolved via @IpcChannel parameter.
 * @param name Optional target window name. If not provided, broadcasts to all windows.
 * @returns A MethodDecorator that wraps the method to send IPC messages.
 *
 * @example
 * ```typescript
 * // Broadcast to all windows
 * @IpcSend('my:channel')
 * async publishData(payload: string): Promise<void> { }
 *
 * // Send to specific window
 * @IpcSend('my:channel', 'mainWindow')
 * async publishData(payload: string): Promise<void> { }
 *
 * // With dynamic channel
 * @IpcSend(undefined, 'mainWindow')
 * async publishData(@IpcChannel() channel: string, payload: string): Promise<void> { }
 * ```
 */
export function IpcSend<C extends string = string>(
  channel?: C,
  name?: string,
): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value as Function;
    if (typeof originalMethod !== 'function') {
      throw new Error('@IpcSend can only be applied to methods.');
    }

    descriptor.value = async function (...args: any[]): Promise<any> {
      const channelParameters = ElectronMetadata.ipc.getChannelParameterIndices(
        target,
        propertyKey,
      );

      let resolvedChannel: string | undefined = channel;
      if (!resolvedChannel) {
        if (channelParameters.length === 0) {
          throw new Error(
            `@IpcSend on method '${String(
              propertyKey,
            )}' requires a channel name or a parameter decorated with @IpcChannel.`,
          );
        }

        if (channelParameters.length > 1) {
          throw new Error(
            `@IpcSend on method '${String(
              propertyKey,
            )}' can only have one parameter decorated with @IpcChannel.`,
          );
        }

        resolvedChannel = args[channelParameters[0]];
      }

      if (!resolvedChannel || typeof resolvedChannel !== 'string') {
        throw new Error(
          `@IpcSend on method '${String(
            propertyKey,
          )}' requires a valid channel name. Got: ${resolvedChannel}`,
        );
      }

      const result = await originalMethod.apply(this, args);
      const windows = BrowserWindow.getAllWindows().filter(
        (window) => !window.isDestroyed(),
      ) as ElectronWindow[];

      const windowContents = windows.length
        ? windows.map((window) => window.webContents)
        : webContents
            .getAllWebContents()
            .filter(
              (contents) =>
                !contents.isDestroyed() && contents.getType() === 'window',
            );

      if (name) {
        const win = windows.find((window) => window.name === name);

        if (win) {
          win.webContents.send(resolvedChannel, result);
        }
      } else {
        for (const contents of windowContents) {
          contents.send(resolvedChannel, result);
        }
      }

      return result;
    };
    return descriptor;
  };
}
