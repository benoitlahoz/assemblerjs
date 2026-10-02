import { ipcMain } from 'electron';
import { WindowIpcChannel } from '@/common/channels';
import { registerCleanup } from '@/common/lifecycle';
import { ElectronWindow } from '@/window/main/classes/electron-window';
import {
  getActiveWindowInstance,
  getOrCreateState,
  listManagedDefinitions,
} from './window-controller.state';
import type { WindowRuntimeHandle } from './window-controller.types';

export function registerManagedCommandHandlers(controller: any): void {
  const state = getOrCreateState(controller);
  const managedDefinitions = listManagedDefinitions(controller);

  for (const managed of managedDefinitions) {
    for (const command of managed.commands) {
      if (state.registeredHandlers.has(command.channel)) {
        continue;
      }

      ipcMain.removeHandler(command.channel as any);

      const handler = async (event: unknown, ...args: any[]) => {
        const sender = (event as { sender?: Electron.WebContents } | undefined)
          ?.sender;
        const senderWindow = sender
          ? ElectronWindow.getByWebContents(sender)
          : undefined;
        const existing =
          senderWindow?.name === managed.definition.name
            ? senderWindow
            : getActiveWindowInstance(controller, managed);
        const instance =
          (existing as WindowRuntimeHandle | undefined) ||
          ((await controller.openWindow(
            managed.token as any,
            undefined,
          )) as WindowRuntimeHandle);
        const method = instance?.[command.method];

        if (typeof method !== 'function') {
          throw new Error(
            `Window command method '${command.method}' not found on ${managed.definition.name}`,
          );
        }

        return await method.apply(instance, args);
      };

      ipcMain.handle(command.channel as any, handler);
      state.registeredHandlers.add(command.channel);

      registerCleanup(controller, () => {
        ipcMain.removeHandler(command.channel as any);
        state.registeredHandlers.delete(command.channel);
      });
    }
  }
}

export function registerWindowRegistryHandlers(controller: any): void {
  const state = getOrCreateState(controller);

  const handlers: Array<[string, (_event: unknown, ...args: any[]) => any]> = [
    [
      WindowIpcChannel.ListWindowNames,
      async () => controller.listWindowNames(),
    ],
    [
      WindowIpcChannel.ListManagedWindows,
      async () =>
        controller
          .listManagedWindows()
          .map((window: { name: string; multiple: boolean }) => ({
            name: window.name,
            multiple: window.multiple,
          })),
    ],
    [
      WindowIpcChannel.HasWindow,
      async (_event, name: string) => controller.hasWindow(name),
    ],
    [
      WindowIpcChannel.OpenWindow,
      async (_event, name: string, configuration?: Record<string, any>) => {
        await controller.openWindow(name, configuration);
        return true;
      },
    ],
    [
      WindowIpcChannel.CloseWindow,
      async (event, name: string) => {
        const sender = (event as { sender?: Electron.WebContents } | undefined)
          ?.sender;
        const senderWindow = sender
          ? ElectronWindow.getByWebContents(sender)
          : undefined;
        return controller.closeWindow(
          name,
          senderWindow?.name === name ? senderWindow.id : undefined,
        );
      },
    ],
  ];

  for (const [channel, handler] of handlers) {
    if (state.registeredHandlers.has(channel)) {
      continue;
    }

    ipcMain.removeHandler(channel as any);
    ipcMain.handle(channel as any, handler);
    state.registeredHandlers.add(channel);

    registerCleanup(controller, () => {
      ipcMain.removeHandler(channel as any);
      state.registeredHandlers.delete(channel);
    });
  }
}
