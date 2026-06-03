import { createConstructorDecorator } from 'assemblerjs';
import { getAssemblageContext } from 'assemblerjs';
import { ElectronWindow } from '@/main/window/classes/electron-window';
import {
  attachManagedWindowMenu,
  detachManagedWindowMenu,
} from './window-controller-menu-binding';
import {
  registerManagedCommandHandlers,
  registerWindowRegistryHandlers,
} from './window-controller-handlers';
import { loadManagedWindowContent } from './window-controller-load';
import {
  getOpenedSet,
  listManagedDefinitions,
  removeOpenedInstance,
  resolveManagedDefinition,
} from './window-controller.state';
import type {
  TypedWindowToken,
  TypedWindowControllerRegistry,
  WindowControllerRegistry,
  WindowRuntimeHandle,
  WindowToken,
} from './window-controller.types';

export type {
  TypedWindowToken,
  TypedWindowControllerRegistry,
  WindowControllerRegistry,
};

const openingWindowByName = new Map<string, Promise<any>>();

export const WindowController = createConstructorDecorator(function (
  this: any,
) {
  listManagedDefinitions(this);
  registerManagedCommandHandlers(this);
  registerWindowRegistryHandlers(this);

  if (typeof this.listWindows !== 'function') {
    this.listWindows = (): ElectronWindow[] =>
      ElectronWindow.getAllWindows().filter(
        (window) => !window.isDestroyed(),
      ) as ElectronWindow[];
  }

  if (typeof this.listWindowNames !== 'function') {
    this.listWindowNames = (): string[] =>
      (this.listWindows() as ElectronWindow[]).map((window) => window.name);
  }

  if (typeof this.listManagedWindows !== 'function') {
    this.listManagedWindows = () =>
      listManagedDefinitions(this).map((managed) => ({
        token: managed.token,
        concrete: managed.concrete,
        name: managed.definition.name,
        multiple: managed.definition.multiple,
      }));
  }

  if (typeof this.listWindowChannels !== 'function') {
    this.listWindowChannels = (): string[] => {
      const channels = new Set<string>();
      for (const managed of listManagedDefinitions(this)) {
        for (const command of managed.commands) {
          channels.add(command.channel);
        }
        for (const event of managed.events) {
          channels.add(event.channel);
        }
      }

      return [...channels];
    };
  }

  if (typeof this.openWindow !== 'function') {
    this.openWindow = async (
      tokenOrName: WindowToken | string,
      configuration?: Record<string, any>,
    ) => {
      const managed = resolveManagedDefinition(this, tokenOrName);
      const openedSet = getOpenedSet(this, managed.definition.name);
      const openedInstances = [...openedSet].filter(
        (window) => !window?.isDestroyed || !window.isDestroyed(),
      );

      if (!managed.definition.multiple) {
        if (openedInstances.length > 0) {
          return openedInstances[0];
        }

        // HMR-safe reuse: state can be reset while BrowserWindow is still alive.
        const globalWindow = ElectronWindow.getByName(managed.definition.name);
        if (globalWindow) {
          openedSet.add(globalWindow);
          return globalWindow;
        }

        const pending = openingWindowByName.get(managed.definition.name);
        if (pending) {
          const pendingWindow = (await pending) as WindowRuntimeHandle;
          openedSet.add(pendingWindow);
          return pendingWindow;
        }
      }

      const context = getAssemblageContext(this.constructor);
      const createWindow = async (): Promise<WindowRuntimeHandle> => {
        const instance = context.require(
          managed.token as any,
          configuration,
        ) as WindowRuntimeHandle;

        await loadManagedWindowContent(context, managed, instance);

        openedSet.add(instance);

        if (typeof instance?.once === 'function') {
          instance.once('closed', () => {
            removeOpenedInstance(this, managed.definition.name, instance);
            detachManagedWindowMenu(this, managed);
          });
        }

        await attachManagedWindowMenu(this, managed, instance);

        return instance;
      };

      if (!managed.definition.multiple) {
        const pending = createWindow();
        openingWindowByName.set(managed.definition.name, pending);

        try {
          return await pending;
        } finally {
          const activePending = openingWindowByName.get(
            managed.definition.name,
          );
          if (activePending === pending) {
            openingWindowByName.delete(managed.definition.name);
          }
        }
      }

      return await createWindow();
    };
  }

  if (typeof this.closeWindow !== 'function') {
    this.closeWindow = (tokenOrName: WindowToken | string): boolean => {
      const managed = resolveManagedDefinition(this, tokenOrName);
      const openedSet = getOpenedSet(this, managed.definition.name);
      const instance = [...openedSet].find(
        (window) => !window?.isDestroyed || !window.isDestroyed(),
      );

      if (!instance) {
        return false;
      }

      if (typeof instance.close === 'function') {
        instance.close();
      }

      removeOpenedInstance(this, managed.definition.name, instance);
      detachManagedWindowMenu(this, managed);
      return true;
    };
  }

  if (typeof this.closeAllWindows !== 'function') {
    this.closeAllWindows = (tokenOrName?: WindowToken | string): number => {
      const targets = tokenOrName
        ? [resolveManagedDefinition(this, tokenOrName)]
        : listManagedDefinitions(this);

      let closedCount = 0;
      for (const managed of targets) {
        const openedSet = getOpenedSet(this, managed.definition.name);
        const instances = [...openedSet];

        for (const instance of instances) {
          if (instance?.isDestroyed && instance.isDestroyed()) {
            removeOpenedInstance(this, managed.definition.name, instance);
            continue;
          }

          if (typeof instance?.close === 'function') {
            instance.close();
          }

          removeOpenedInstance(this, managed.definition.name, instance);
          detachManagedWindowMenu(this, managed);
          closedCount += 1;
        }
      }

      return closedCount;
    };
  }

  if (typeof this.getWindow !== 'function') {
    this.getWindow = (name: string): ElectronWindow | undefined =>
      (this.listWindows() as ElectronWindow[]).find(
        (window) => window.name === name,
      );
  }

  if (typeof this.hasWindow !== 'function') {
    this.hasWindow = (name: string): boolean => Boolean(this.getWindow(name));
  }

  if (typeof this.requireWindow !== 'function') {
    this.requireWindow = (name: string): ElectronWindow => {
      const window = this.getWindow(name) as ElectronWindow | undefined;
      if (!window) {
        throw new Error(`Window not found: ${name}`);
      }

      return window;
    };
  }
});
