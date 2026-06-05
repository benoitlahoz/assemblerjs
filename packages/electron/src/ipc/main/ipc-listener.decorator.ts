import { ipcMain, type IpcMain } from 'electron';
import { createIpcListener } from '@/common/decorators/create-ipc-listener';

const activeHandleListeners = new Map<string, (...args: any[]) => any>();

/**
 * Class decorator to allow using 'ipcMain' decorators.
 * @see https://stackoverflow.com/a/61448736/1060921
 */
export const IpcListener = createIpcListener<IpcMain>({
  getApi: () => ipcMain,

  setupHandler: (api, instance, method, handler) => {
    // Remove existing handler to avoid duplicates
    if (handler.type === 'handle') {
      api.removeHandler(handler.channel as any);
    }

    // Create listener that optionally filters out the event parameter
    const listener = (...args: any[]) => {
      if (!handler.withEvent) {
        return instance[method](...args.slice(1));
      }
      return instance[method](...args);
    };

    // Register the listener
    if (handler.type === 'handle') {
      activeHandleListeners.set(handler.channel, listener);
      api.handle(handler.channel as any, listener);

      // Cleanup function
      return () => {
        if (activeHandleListeners.get(handler.channel) === listener) {
          api.removeHandler(handler.channel as any);
          activeHandleListeners.delete(handler.channel);
        }
      };
    } else {
      api[handler.type](handler.channel as any, listener);

      // Cleanup function
      return () => {
        api.off(handler.channel as any, listener);
      };
    }
  },
});
