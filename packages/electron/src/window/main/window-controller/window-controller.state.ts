import { getAssemblageDefinition } from 'assemblerjs';
import { ElectronWindow } from '@/window/main/classes/electron-window';
import { getWindowDefinition } from '../window-definition/window.decorator';
import { getWindowCommands } from '../window-command/window-command.decorator';
import { getWindowEmitEvents } from '../window-listener/window-emit.decorator';
import { createChannelBuilder } from '@assemblerjs/common';
import type {
  ManagedWindowDefinition,
  WindowControllerState,
  WindowToken,
} from './window-controller.types';

const buildWindowChannel = createChannelBuilder('window');

const stateSymbol = Symbol('__WindowControllerState__');

export function getOrCreateState(controller: any): WindowControllerState {
  if (!controller[stateSymbol]) {
    controller[stateSymbol] = {
      managed: [],
      opened: new Map<string, Set<any>>(),
      registeredHandlers: new Set<string>(),
    } as WindowControllerState;
  }

  return controller[stateSymbol] as WindowControllerState;
}

export function listManagedDefinitions(
  controller: any,
): ManagedWindowDefinition[] {
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
        channel: buildWindowChannel(windowDefinition.name, metadata.command),
      })),
      events: getWindowEmitEvents(concrete).map((metadata) => ({
        ...metadata,
        channel: buildWindowChannel(windowDefinition.name, metadata.event),
      })),
    });
  }

  return state.managed;
}

export function getOpenedSet(controller: any, name: string): Set<any> {
  const state = getOrCreateState(controller);
  const existing = state.opened.get(name);
  if (existing) {
    return existing;
  }

  const created = new Set<any>();
  state.opened.set(name, created);
  return created;
}

export function removeOpenedInstance(
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

export function resolveManagedDefinition(
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

export function getActiveWindowInstance(
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

  const globalWindow = ElectronWindow.getByName(managed.definition.name);
  if (globalWindow) {
    openedSet.add(globalWindow);
    return globalWindow;
  }

  return undefined;
}
