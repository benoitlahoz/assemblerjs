import { createConstructorDecorator } from 'assemblerjs';
import { type IpcType, IpcSubMethods } from './ipc-decorators.types';
import { registerCleanup } from '@/common/lifecycle';

/**
 * Configuration for creating an IPC listener decorator.
 */
export interface IpcListenerConfig<TApi> {
  /**
   * Get the IPC API (ipcMain or window.ipc bridge).
   */
  getApi: () => TApi | undefined;

  /**
   * Setup a handler for a specific channel and type.
   * Returns a cleanup function.
   */
  setupHandler: (
    api: TApi,
    instance: any,
    method: string,
    handler: { channel: string; type: IpcType; withEvent?: boolean },
  ) => () => void;

  /**
   * Optional error message when API is not available.
   */
  apiErrorMessage?: string;
}

/**
 * Factory to create IPC listener decorators for both main and renderer processes.
 * Eliminates duplication between main/ipc and renderer/ipc listener implementations.
 *
 * Returns a decorator factory compatible with createConstructorDecorator pattern.
 */
export function createIpcListener<TApi>(config: IpcListenerConfig<TApi>) {
  return createConstructorDecorator(function (this: any) {
    const api = config.getApi();

    if (!api) {
      if (config.apiErrorMessage) {
        throw new Error(config.apiErrorMessage);
      }
      return;
    }

    // Get the methods decorated with @IpcHandle, @IpcOn, @IpcOnce
    const subMethods = this.constructor.prototype[IpcSubMethods];

    if (subMethods) {
      subMethods.forEach(
        (
          handler: { channel: string; type: IpcType; withEvent?: boolean },
          method: string,
        ) => {
          const cleanup = config.setupHandler(api, this, method, handler);
          registerCleanup(this, cleanup);
        },
      );
    }
  });
}
