import { buildWindowCommandChannel } from './window-channels';

export const WindowCommand = (command: string): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const originalMethod = descriptor.value as Function;

    descriptor.value = async function (
      this: { windowName?: unknown },
      ...args: any[]
    ): Promise<any> {
      const ipcResultParameters: number[] =
        Reflect.getMetadata('ipc-result:parameters', target, propertyKey) || [];

      const windowName = this?.windowName;
      if (!windowName || typeof windowName !== 'string') {
        throw new Error(
          `@WindowCommand on method '${String(
            propertyKey,
          )}' requires an instance string property 'windowName'.`,
        );
      }

      const bridge = window.ipc;
      if (!bridge) {
        throw new Error('IpcRenderer is not available in the current context.');
      }

      const channel = buildWindowCommandChannel(windowName, command);
      const result = await bridge.invoke(
        channel,
        ...args.filter((_, i) => !ipcResultParameters.includes(i)),
      );

      ipcResultParameters.forEach((index) => {
        args[index] = result;
      });

      return await originalMethod.call(this, ...args);
    };

    return descriptor;
  };
};
