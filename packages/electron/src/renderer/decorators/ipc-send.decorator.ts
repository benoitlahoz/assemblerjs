export const IpcSend = (channel?: string): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
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

      const ipcResultParameters: number[] =
        Reflect.getMetadata('ipc-result:parameters', target, propertyKey) || [];

      const bridge = window.ipc;
      if (!bridge) {
        throw new Error('IpcRenderer is not available in the current context.');
      }

      const result = bridge.ipc.send(
        channel,
        ...args.filter((_, i) => !ipcResultParameters.includes(i))
      );

      ipcResultParameters.forEach((index) => {
        args[index] = result;
      });

      return originalMethod.call(this, ...args);
    };

    return descriptor;
  };
};
