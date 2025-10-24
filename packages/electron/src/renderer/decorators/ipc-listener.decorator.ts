import { createConstructorDecorator } from 'assemblerjs';
import { IpcType, IpcSubMethods } from '@/universal/decorators';

/**
 * Class decorator to allow using preload scripts IPC API decorators.
 * @see https://stackoverflow.com/a/61448736/1060921
 */
export const IpcListener = createConstructorDecorator(function (this: any) {
  const bridge = window.ipc;
  if (!bridge) {
    throw new Error('IpcRenderer is not available in the current context.');
  }

  // Since the class returned by this decorator is a wrapper of `Assemblage` get the constructor methods.
  const subMethods = this.constructor.prototype[IpcSubMethods];

  if (subMethods) {
    try {
      subMethods.forEach(
        (handler: { channel: string; type: IpcType }, method: string) => {
          const originalMethod = this[method];
          if (typeof originalMethod !== 'function') {
            throw new Error(
              `Method ${method} is not a function on the target class.`
            );
          }
          const ipcResultParameters: number[] =
            Reflect.getMetadata('ipc-result:parameters', this, method) || [];

          const newMethod = async (...args: any[]) => {
            const newArgs = args.filter(
              (_, i) => !ipcResultParameters.includes(i)
            );
            const result = await originalMethod.apply(this, newArgs);

            return result;
          };

          bridge.ipc[handler.type](handler.channel as any, newMethod);
        }
      );
    } catch (error) {
      console.error('Error while setting up IPC listeners:', error);
    }
  }
});
