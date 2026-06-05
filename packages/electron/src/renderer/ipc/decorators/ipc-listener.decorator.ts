import { createIpcListener } from '@/universal/decorators/create-ipc-listener';
import { getIpcResultParameterIndices } from '@/universal/metadata';
import type { TypedIpcBridge } from '@/universal/types';

/**
 * Class decorator to allow using preload scripts IPC API decorators.
 * @see https://stackoverflow.com/a/61448736/1060921
 */
export const IpcListener = createIpcListener<TypedIpcBridge>({
  getApi: () => window.ipc,

  apiErrorMessage: 'IpcRenderer is not available in the current context.',

  setupHandler: (api, instance, method, handler) => {
    const originalMethod = instance[method];

    if (typeof originalMethod !== 'function') {
      throw new Error(
        `Method ${method} is not a function on the target class.`,
      );
    }

    // Get parameter indices that should be filtered out (@IpcResult decorators)
    const ipcResultParameters = getIpcResultParameterIndices(instance, method);

    // Create wrapped method that filters IpcResult parameters
    const newMethod = async (...args: any[]) => {
      const newArgs = args.filter((_, i) => !ipcResultParameters.includes(i));
      const result = await originalMethod.apply(instance, newArgs);
      return result;
    };

    // Register handler with bridge
    if (handler.type === 'handle') {
      const unsubscribe = api.handle(handler.channel as any, newMethod);

      // Cleanup function
      return () => {
        unsubscribe();
        api.removeHandler(handler.channel as any);
      };
    }

    // Register on/once listener
    api[handler.type](handler.channel as any, newMethod);

    // Cleanup function
    return () => {
      api.off(handler.channel as any, newMethod);
    };
  },
});
