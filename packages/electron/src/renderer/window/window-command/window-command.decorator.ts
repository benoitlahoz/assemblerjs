import { createChannelBuilder } from '@assemblerjs/common';
import { resolveWindowRendererName } from '../window-definition/window-definition';
import { getIpcResultParameterIndices } from '@/universal/metadata';

const buildWindowChannel = createChannelBuilder('window');

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
      const ipcResultParameters = getIpcResultParameterIndices(
        target,
        propertyKey,
      );

      const windowName = resolveWindowRendererName(this);
      if (!windowName || typeof windowName !== 'string') {
        throw new Error(
          `@WindowCommand on method '${String(
            propertyKey,
          )}' requires a window name (via instance 'windowName' or @Window).`,
        );
      }

      const bridge = window.ipc;
      if (!bridge) {
        throw new Error('IpcRenderer is not available in the current context.');
      }

      const channel = buildWindowChannel(windowName, command);
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
