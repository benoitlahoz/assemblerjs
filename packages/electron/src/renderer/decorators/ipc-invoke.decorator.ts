/**
 * Invokes an IPC handler from the renderer process and waits for the response.
 * 
 * @template Contracts The IPC contract map for type-safe channel resolution
 * @template Response The expected response type from the handler
 * @param channel Optional channel name. If not provided, must be resolved via @IpcChannel parameter.
 * @returns A MethodDecorator that wraps the method to invoke IPC handlers.
 * 
 * @example
 * ```typescript
 * @IpcInvoke('my:handler')
 * async fetchData(payload: string): Promise<Data> { }
 * 
 * // Or with dynamic channel:
 * @IpcInvoke()
 * async fetchData(@IpcChannel() channel: string, payload: string): Promise<Data> { }
 * ```
 */
export function IpcInvoke<C extends string = string>(
  channel?: C
): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    const originalMethod = descriptor.value as Function;

    descriptor.value = async function (...args: any[]): Promise<any> {
      const channelParameters: number[] =
        Reflect.getMetadata('ipc-channel:parameters', target, propertyKey) || [];

      let resolvedChannel: string | undefined = channel;
      if (!resolvedChannel) {
        if (channelParameters.length === 0) {
          throw new Error(
            `@IpcInvoke on method '${String(
              propertyKey
            )}' requires a channel name or a parameter decorated with @IpcChannel.`
          );
        }

        if (channelParameters.length > 1) {
          throw new Error(
            `@IpcInvoke on method '${String(
              propertyKey
            )}' can only have one parameter decorated with @IpcChannel.`
          );
        }

        resolvedChannel = args[channelParameters[0]];
      }

      if (!resolvedChannel || typeof resolvedChannel !== 'string') {
        throw new Error(
          `@IpcInvoke on method '${String(
            propertyKey
          )}' requires a valid channel name. Got: ${resolvedChannel}`
        );
      }

      const ipcResultParameters: number[] =
        Reflect.getMetadata('ipc-result:parameters', target, propertyKey) || [];
      const excludedParameters = new Set([
        ...channelParameters,
        ...ipcResultParameters,
      ]);

      const bridge = window.ipc;
      if (!bridge) {
        throw new Error('IpcRenderer is not available in the current context.');
      }

      const result = await bridge.ipc.invoke(
        resolvedChannel,
        ...args.filter((_, i) => !excludedParameters.has(i))
      );

      ipcResultParameters.forEach((index) => {
        args[index] = result;
      });

      return await originalMethod.call(this, ...args);
    };

    return descriptor;
  };
}
