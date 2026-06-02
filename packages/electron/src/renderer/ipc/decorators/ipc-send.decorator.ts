import {
  getIpcChannelParameterIndices,
  getIpcResultParameterIndices,
} from '@/universal/metadata';

/**
 * Sends an IPC message from the renderer process to the main process.
 *
 * @template Contracts The IPC contract map for type-safe channel resolution
 * @param channel Optional channel name. If not provided, must be resolved via @IpcChannel parameter.
 * @returns A MethodDecorator that wraps the method to send IPC messages.
 *
 * @example
 * ```typescript
 * @IpcSend('my:channel')
 * sendMessage(payload: string): void { }
 *
 * // Or with dynamic channel:
 * @IpcSend()
 * sendMessage(@IpcChannel() channel: string, payload: string): void { }
 * ```
 */
export function IpcSend<C extends string = string>(
  channel?: C,
): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const originalMethod = descriptor.value as Function;

    descriptor.value = function (...args: any[]): void {
      const channelParameters = getIpcChannelParameterIndices(
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

      const ipcResultParameters = getIpcResultParameterIndices(
        target,
        propertyKey,
      );
      const excludedParameters = new Set([
        ...channelParameters,
        ...ipcResultParameters,
      ]);

      const bridge = window.ipc;
      if (!bridge) {
        throw new Error('IpcRenderer is not available in the current context.');
      }

      const result = bridge.send(
        resolvedChannel,
        ...args.filter((_, i) => !excludedParameters.has(i)),
      );

      ipcResultParameters.forEach((index) => {
        args[index] = result;
      });

      return originalMethod.call(this, ...args);
    };

    return descriptor;
  };
}
