export const IpcInvoke = (channel?: string): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const channelParameters: number[] =
        Reflect.getMetadata('ipc-channel:parameters', target, propertyKey) || [];

      let resolvedChannel = channel;
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
};
