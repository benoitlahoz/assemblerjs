import { createConstructorDecorator } from 'assemblerjs';
import { getAssemblageContext, getAssemblageDefinition } from 'assemblerjs';
import type { Identifier } from 'assemblerjs';
import { ipcMain } from 'electron';
import { ElectronWindow } from '@/main/window/classes/electron-window';
import { WindowIpcChannel } from '@/universal/channels';
import {
  loadWindowContent,
  type WindowContentTarget,
} from '@/main/window/load-window-content';
import { registerCleanup } from '@/universal/lifecycle';
import {
  getWindowDefinition,
  type NormalizedWindowDefinition,
} from './window.decorator';
import { getWindowCommands } from './window-command.decorator';
import { getWindowEmitEvents } from './window-emit.decorator';
import {
  buildWindowCommandChannel,
  buildWindowEventChannel,
} from './window-channels';

type WindowToken = Identifier<any>;

interface ManagedWindowCommand {
  method: string;
  command: string;
  channel: string;
}

interface ManagedWindowEvent {
  method: string;
  event: string;
  channel: string;
}

interface ManagedWindowDefinition {
  token: WindowToken;
  concrete: Function;
  definition: NormalizedWindowDefinition;
  commands: ManagedWindowCommand[];
  events: ManagedWindowEvent[];
}

interface WindowControllerState {
  managed: ManagedWindowDefinition[];
  opened: Map<string, Set<any>>;
  registeredHandlers: Set<string>;
}

const openingWindowByName = new Map<string, Promise<any>>();

interface WindowRuntimeHandle {
  loadURL?: (url: string) => Promise<unknown>;
  loadFile?: (
    path: string,
    options?: {
      hash?: string;
    },
  ) => Promise<unknown>;
  once?: (event: string, callback: () => void) => void;
  close?: () => void;
  isDestroyed?: () => boolean;
  [key: string]: unknown;
}

function isWindowContentTarget(
  instance: WindowRuntimeHandle,
): instance is WindowRuntimeHandle & WindowContentTarget {
  return (
    typeof instance.loadURL === 'function' &&
    typeof instance.loadFile === 'function'
  );
}

const stateSymbol = Symbol('__WindowControllerState__');

function getOrCreateState(controller: any): WindowControllerState {
  if (!controller[stateSymbol]) {
    controller[stateSymbol] = {
      managed: [],
      opened: new Map<string, Set<any>>(),
      registeredHandlers: new Set<string>(),
    } as WindowControllerState;
  }

  return controller[stateSymbol] as WindowControllerState;
}

function listManagedDefinitions(controller: any): ManagedWindowDefinition[] {
  const state = getOrCreateState(controller);
  if (state.managed.length > 0) {
    return state.managed;
  }

  const controllerDefinition =
    getAssemblageDefinition(controller.constructor) || {};
  const provide = (controllerDefinition.provide ||
    controllerDefinition.inject ||
    []) as unknown as Array<any[]>;

  for (const injection of provide) {
    if (!Array.isArray(injection)) {
      continue;
    }

    const token = injection[0] as WindowToken;
    const concrete = (injection[1] || injection[0]) as Function;
    const windowDefinition =
      getWindowDefinition(concrete) || getWindowDefinition(token as any);

    if (!windowDefinition) {
      continue;
    }

    // Force transient windows, regardless of @Assemblage singleton value.
    const assemblageDefinition = getAssemblageDefinition(concrete as any);
    if (assemblageDefinition) {
      assemblageDefinition.singleton = false;
    }

    state.managed.push({
      token,
      concrete,
      definition: windowDefinition,
      commands: getWindowCommands(concrete).map((metadata) => ({
        ...metadata,
        channel: buildWindowCommandChannel(
          windowDefinition.name,
          metadata.command,
        ),
      })),
      events: getWindowEmitEvents(concrete).map((metadata) => ({
        ...metadata,
        channel: buildWindowEventChannel(windowDefinition.name, metadata.event),
      })),
    });
  }

  return state.managed;
}

function getOpenedSet(controller: any, name: string): Set<any> {
  const state = getOrCreateState(controller);
  const existing = state.opened.get(name);
  if (existing) {
    return existing;
  }

  const created = new Set<any>();
  state.opened.set(name, created);
  return created;
}

function removeOpenedInstance(
  controller: any,
  name: string,
  instance: any,
): void {
  const state = getOrCreateState(controller);
  const set = state.opened.get(name);
  if (!set) {
    return;
  }

  set.delete(instance);
  if (set.size === 0) {
    state.opened.delete(name);
  }
}

function findManagedByName(
  controller: any,
  name: string,
): ManagedWindowDefinition | undefined {
  return listManagedDefinitions(controller).find(
    (managed) => managed.definition.name === name,
  );
}

function findManagedByToken(
  controller: any,
  token: WindowToken,
): ManagedWindowDefinition | undefined {
  return listManagedDefinitions(controller).find(
    (managed) => managed.token === token,
  );
}

function resolveManagedDefinition(
  controller: any,
  tokenOrName: WindowToken | string,
): ManagedWindowDefinition {
  const managed =
    typeof tokenOrName === 'string'
      ? findManagedByName(controller, tokenOrName)
      : findManagedByToken(controller, tokenOrName);

  if (!managed) {
    const key =
      typeof tokenOrName === 'string'
        ? tokenOrName
        : (tokenOrName as any)?.name || '<anonymous>';
    throw new Error(`Window definition not managed by controller: ${key}`);
  }

  return managed;
}

function getActiveWindowInstance(
  controller: any,
  managed: ManagedWindowDefinition,
): any | undefined {
  const openedSet = getOpenedSet(controller, managed.definition.name);
  const existing = [...openedSet].find(
    (window) => !window?.isDestroyed || !window.isDestroyed(),
  );

  if (existing) {
    return existing;
  }

  // Fallback: if controller-local state was lost/desynced, reuse the globally opened window.
  const globalWindow = ElectronWindow.getByName(managed.definition.name);
  if (globalWindow) {
    openedSet.add(globalWindow);
    return globalWindow;
  }

  return undefined;
}

function registerManagedCommandHandlers(controller: any): void {
  const state = getOrCreateState(controller);
  const managedDefinitions = listManagedDefinitions(controller);

  for (const managed of managedDefinitions) {
    for (const command of managed.commands) {
      if (state.registeredHandlers.has(command.channel)) {
        continue;
      }

      ipcMain.removeHandler(command.channel as any);

      const handler = async (_event: unknown, ...args: any[]) => {
        const existing = getActiveWindowInstance(controller, managed);
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

function registerWindowRegistryHandlers(controller: any): void {
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
      async (_event, name: string) => controller.closeWindow(name),
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

function looksLikeLiteralPathOrUrl(value: string): boolean {
  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('file://') ||
    value.includes('/') ||
    value.includes('\\') ||
    value.endsWith('.html')
  );
}

function resolveRouterValue(
  context: ReturnType<typeof getAssemblageContext>,
  value?: string,
): string | undefined {
  if (!value) {
    return undefined;
  }

  const fromGlobal = context.global(value);
  if (typeof fromGlobal === 'string' && fromGlobal.length > 0) {
    return fromGlobal;
  }

  if (looksLikeLiteralPathOrUrl(value)) {
    return value;
  }

  return undefined;
}

async function loadManagedWindowContent(
  context: ReturnType<typeof getAssemblageContext>,
  managed: ManagedWindowDefinition,
  instance: WindowRuntimeHandle,
): Promise<void> {
  const router = managed.definition.router;
  if (!router) {
    return;
  }

  const file = resolveRouterValue(context, router.file);
  if (!file) {
    throw new Error(
      `Missing router file for window '${managed.definition.name}'. Define router.file as a global key or literal file path.`,
    );
  }

  const devUrl = resolveRouterValue(context, router.dev);

  if (!isWindowContentTarget(instance)) {
    throw new Error(
      `Window '${managed.definition.name}' does not implement loadURL/loadFile required for router-based content loading.`,
    );
  }

  await loadWindowContent(instance, {
    devUrl,
    file,
    route: router.route,
  });
}

export interface WindowControllerRegistry {
  listWindows(): ElectronWindow[];
  listWindowNames(): string[];
  listWindowChannels(): string[];
  listManagedWindows(): Array<{
    token: WindowToken;
    concrete: Function;
    name: string;
    multiple: boolean;
  }>;
  openWindow(
    tokenOrName: WindowToken | string,
    configuration?: Record<string, any>,
  ): Promise<any>;
  closeWindow(tokenOrName: WindowToken | string): boolean;
  closeAllWindows(tokenOrName?: WindowToken | string): number;
  getWindow(name: string): ElectronWindow | undefined;
  hasWindow(name: string): boolean;
  requireWindow(name: string): ElectronWindow;
}

export type TypedWindowControllerRegistry<
  Windows extends Record<string, ElectronWindow>,
> = Omit<
  WindowControllerRegistry,
  | 'openWindow'
  | 'closeWindow'
  | 'closeAllWindows'
  | 'getWindow'
  | 'hasWindow'
  | 'requireWindow'
> & {
  openWindow<Name extends keyof Windows & string>(
    name: Name,
    configuration?: Record<string, any>,
  ): Promise<Windows[Name]>;
  openWindow(
    tokenOrName: WindowToken | string,
    configuration?: Record<string, any>,
  ): Promise<any>;

  closeWindow<Name extends keyof Windows & string>(name: Name): boolean;
  closeWindow(tokenOrName: WindowToken | string): boolean;

  closeAllWindows<Name extends keyof Windows & string>(name?: Name): number;
  closeAllWindows(tokenOrName?: WindowToken | string): number;

  getWindow<Name extends keyof Windows & string>(
    name: Name,
  ): Windows[Name] | undefined;
  getWindow(name: string): ElectronWindow | undefined;

  hasWindow<Name extends keyof Windows & string>(name: Name): boolean;
  hasWindow(name: string): boolean;

  requireWindow<Name extends keyof Windows & string>(name: Name): Windows[Name];
  requireWindow(name: string): ElectronWindow;
};

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
          });
        }

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
