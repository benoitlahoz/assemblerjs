import { createChannelBuilder } from '@assemblerjs/common';
import { MenuIpcChannel } from '@/common';
import { ElectronMetadata } from '@/common/metadata';
import { resolveMenuWindowName } from '../menu-definition/menu-definition';

const buildMenuChannel = createChannelBuilder('menu');

function resolveFallbackChannel(command: string): string | undefined {
  if (command === 'snapshot') {
    return MenuIpcChannel.GetSnapshot;
  }

  if (command === 'setItemEnabled') {
    return MenuIpcChannel.SetItemEnabled;
  }

  if (command === 'setItemChecked') {
    return MenuIpcChannel.SetItemChecked;
  }

  return undefined;
}

export const MenuCommand = (command: string): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const originalMethod = descriptor.value as Function;

    descriptor.value = async function (
      this: any,
      ...args: any[]
    ): Promise<any> {
      const ipcResultParameters =
        ElectronMetadata.ipc.getResultParameterIndices(target, propertyKey);

      const windowName = resolveMenuWindowName(this);
      if (!windowName || typeof windowName !== 'string') {
        throw new Error(
          `@MenuCommand on method '${String(
            propertyKey,
          )}' requires a window name (via instance 'windowName', @Window, or injected window service).`,
        );
      }

      const bridge = window.ipc;
      if (!bridge) {
        throw new Error('IpcRenderer is not available in the current context.');
      }

      const payload = args.filter(
        (_, index) => !ipcResultParameters.includes(index),
      );
      const scopedChannel = buildMenuChannel(windowName, command);
      const fallbackChannel = resolveFallbackChannel(command);

      let result: unknown;
      try {
        result = await bridge.invoke(scopedChannel as any, ...payload);
      } catch (error) {
        if (!fallbackChannel) {
          throw error;
        }

        result = await bridge.invoke(
          fallbackChannel as any,
          windowName,
          ...payload,
        );
      }

      ipcResultParameters.forEach((index) => {
        args[index] = result;
      });

      return await originalMethod.call(this, ...args);
    };

    return descriptor;
  };
};
