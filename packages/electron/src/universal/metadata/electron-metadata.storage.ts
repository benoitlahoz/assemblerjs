import {
  createScopedMetadataStore,
  MetadataStorage,
  type MethodName,
} from '@assemblerjs/common';

const electronMetadata = createScopedMetadataStore('electron', MetadataStorage);

export interface ElectronWindowDefinitionMetadata {
  name: string;
  multiple: boolean;
  router?: {
    file?: string;
    dev?: string;
    route?: string;
  };
  options: unknown;
}

export interface ElectronMenuDefinitionMetadata {
  window: string;
  name: string;
}

interface WindowCommandMetadataEntry {
  method: string;
  command: string;
}

interface MenuCommandMetadataEntry {
  method: string;
  command: string;
}

interface WindowEmitMetadataEntry {
  method: string;
  event: string;
}

export type RendererIpcSubscriptionType = 'on' | 'once';

export interface WindowRendererSubscriptionMetadata {
  method: string;
  event: string;
  type: RendererIpcSubscriptionType;
}

export interface MenuRendererSubscriptionMetadata {
  method: string;
  event: string;
  type: RendererIpcSubscriptionType;
}

export interface WindowMainSubscriptionMetadata {
  method: string;
  channel: string;
}

export const ElectronMetadataNames = {
  IpcChannelParameters: 'ipc.channel.parameters',
  IpcResultParameters: 'ipc.result.parameters',
  WindowDefinition: 'window.definition',
  MenuDefinition: 'menu.definition',
  WindowRendererDefinition: 'window.renderer.definition',
  MenuRendererDefinition: 'menu.renderer.definition',
  WindowCommand: 'window.command',
  MenuCommand: 'menu.command',
  WindowEmit: 'window.emit',
  WindowRendererSubscription: 'window.renderer.subscription',
  MenuRendererSubscription: 'menu.renderer.subscription',
  WindowMainSubscription: 'window.main.subscription',
} as const;

function resolveConstructor(target: Function | object): Function {
  if (typeof target === 'function') {
    return target;
  }

  const ctor = (target as { constructor?: Function }).constructor;
  if (!ctor) {
    throw new Error('Unable to resolve constructor for metadata lookup.');
  }

  return ctor;
}

function uniqueByMethod<T extends { method: string }>(entries: T[]): T[] {
  const unique = new Map<string, T>();

  for (const entry of entries) {
    if (!unique.has(entry.method)) {
      unique.set(entry.method, entry);
    }
  }

  return [...unique.values()];
}

export function setIpcChannelParameterIndices(
  target: object,
  method: MethodName,
  indices: number[],
): void {
  electronMetadata.setParamIndices(
    ElectronMetadataNames.IpcChannelParameters,
    target,
    method,
    indices,
  );
}

export function getIpcChannelParameterIndices(
  target: object,
  method: MethodName,
): number[] {
  return electronMetadata.getParamIndices(
    ElectronMetadataNames.IpcChannelParameters,
    target,
    method,
  );
}

export function setIpcResultParameterIndices(
  target: object,
  method: MethodName,
  indices: number[],
): void {
  electronMetadata.setParamIndices(
    ElectronMetadataNames.IpcResultParameters,
    target,
    method,
    indices,
  );
}

export function getIpcResultParameterIndices(
  target: object,
  method: MethodName,
): number[] {
  return electronMetadata.getParamIndices(
    ElectronMetadataNames.IpcResultParameters,
    target,
    method,
  );
}

export function setWindowDefinitionMetadata(
  target: Function,
  definition: ElectronWindowDefinitionMetadata,
): void {
  electronMetadata.setClass(
    ElectronMetadataNames.WindowDefinition,
    target,
    definition,
  );
}

export function getWindowDefinitionMetadata(
  target: Function,
): ElectronWindowDefinitionMetadata | undefined {
  return electronMetadata.getClass(
    ElectronMetadataNames.WindowDefinition,
    target,
  );
}

export function setMenuDefinitionMetadata(
  target: Function,
  definition: ElectronMenuDefinitionMetadata,
): void {
  electronMetadata.setClass(
    ElectronMetadataNames.MenuDefinition,
    target,
    definition,
  );
}

export function getMenuDefinitionMetadata(
  target: Function,
): ElectronMenuDefinitionMetadata | undefined {
  return electronMetadata.getClass(
    ElectronMetadataNames.MenuDefinition,
    target,
  );
}

export function setWindowRendererDefinitionMetadata(
  target: Function,
  definition: { name: string },
): void {
  electronMetadata.setClass(
    ElectronMetadataNames.WindowRendererDefinition,
    target,
    definition,
  );
}

export function getWindowRendererDefinitionMetadata(
  target: Function,
): { name: string } | undefined {
  return electronMetadata.getClass(
    ElectronMetadataNames.WindowRendererDefinition,
    target,
  );
}

export function setMenuRendererDefinitionMetadata(
  target: Function,
  definition: ElectronMenuDefinitionMetadata,
): void {
  electronMetadata.setClass(
    ElectronMetadataNames.MenuRendererDefinition,
    target,
    definition,
  );
}

export function getMenuRendererDefinitionMetadata(
  target: Function,
): ElectronMenuDefinitionMetadata | undefined {
  return electronMetadata.getClass(
    ElectronMetadataNames.MenuRendererDefinition,
    target,
  );
}

export function addWindowCommandMetadata(
  target: object,
  method: string,
  command: string,
): void {
  electronMetadata.addMethodEntry(
    ElectronMetadataNames.WindowCommand,
    target,
    method,
    { method, command } as WindowCommandMetadataEntry,
  );
}

export function getWindowCommandMetadata(
  target: Function,
): WindowCommandMetadataEntry[] {
  return uniqueByMethod(
    electronMetadata.getMethodEntries<WindowCommandMetadataEntry>(
      ElectronMetadataNames.WindowCommand,
      target,
    ),
  );
}

export function addMenuCommandMetadata(
  target: object,
  method: string,
  command: string,
): void {
  electronMetadata.addMethodEntry(
    ElectronMetadataNames.MenuCommand,
    target,
    method,
    {
      method,
      command,
    } as MenuCommandMetadataEntry,
  );
}

export function getMenuCommandMetadata(
  target: Function,
): MenuCommandMetadataEntry[] {
  return uniqueByMethod(
    electronMetadata.getMethodEntries<MenuCommandMetadataEntry>(
      ElectronMetadataNames.MenuCommand,
      target,
    ),
  );
}

export function addWindowEmitMetadata(
  target: object,
  method: string,
  event: string,
): void {
  electronMetadata.addMethodEntry(
    ElectronMetadataNames.WindowEmit,
    target,
    method,
    {
      method,
      event,
    } as WindowEmitMetadataEntry,
  );
}

export function getWindowEmitMetadata(
  target: Function,
): WindowEmitMetadataEntry[] {
  return uniqueByMethod(
    electronMetadata.getMethodEntries<WindowEmitMetadataEntry>(
      ElectronMetadataNames.WindowEmit,
      target,
    ),
  );
}

export function getWindowEmitMetadataForMethod(
  target: object | Function,
  method: string,
): WindowEmitMetadataEntry | undefined {
  const ctor = resolveConstructor(target);
  const entries = electronMetadata.getMethodEntries<WindowEmitMetadataEntry>(
    ElectronMetadataNames.WindowEmit,
    ctor,
    method,
  );

  return entries[0];
}

export function addWindowRendererSubscriptionMetadata(
  target: object,
  method: string,
  event: string,
  type: RendererIpcSubscriptionType,
): void {
  electronMetadata.addMethodEntry(
    ElectronMetadataNames.WindowRendererSubscription,
    target,
    method,
    { method, event, type } as WindowRendererSubscriptionMetadata,
  );
}

export function getWindowRendererSubscriptionMetadata(
  target: Function,
): WindowRendererSubscriptionMetadata[] {
  return uniqueByMethod(
    electronMetadata.getMethodEntries<WindowRendererSubscriptionMetadata>(
      ElectronMetadataNames.WindowRendererSubscription,
      target,
    ),
  );
}

export function addMenuRendererSubscriptionMetadata(
  target: object,
  method: string,
  event: string,
  type: RendererIpcSubscriptionType,
): void {
  electronMetadata.addMethodEntry(
    ElectronMetadataNames.MenuRendererSubscription,
    target,
    method,
    { method, event, type } as MenuRendererSubscriptionMetadata,
  );
}

export function getMenuRendererSubscriptionMetadata(
  target: Function,
): MenuRendererSubscriptionMetadata[] {
  return uniqueByMethod(
    electronMetadata.getMethodEntries<MenuRendererSubscriptionMetadata>(
      ElectronMetadataNames.MenuRendererSubscription,
      target,
    ),
  );
}

export function addWindowMainSubscriptionMetadata(
  target: object,
  method: string,
  channel: string,
): void {
  electronMetadata.addMethodEntry(
    ElectronMetadataNames.WindowMainSubscription,
    target,
    method,
    { method, channel } as WindowMainSubscriptionMetadata,
  );
}

export function getWindowMainSubscriptionMetadata(
  target: Function,
): WindowMainSubscriptionMetadata[] {
  return uniqueByMethod(
    electronMetadata.getMethodEntries<WindowMainSubscriptionMetadata>(
      ElectronMetadataNames.WindowMainSubscription,
      target,
    ),
  );
}

export const ElectronMetadataStorage = {
  names: ElectronMetadataNames,
  getKey(name: keyof typeof ElectronMetadataNames): string {
    return electronMetadata.getKey(ElectronMetadataNames[name]);
  },
  setIpcChannelParameterIndices,
  getIpcChannelParameterIndices,
  setIpcResultParameterIndices,
  getIpcResultParameterIndices,
  setWindowDefinitionMetadata,
  getWindowDefinitionMetadata,
  setMenuDefinitionMetadata,
  getMenuDefinitionMetadata,
  setWindowRendererDefinitionMetadata,
  getWindowRendererDefinitionMetadata,
  setMenuRendererDefinitionMetadata,
  getMenuRendererDefinitionMetadata,
  addWindowCommandMetadata,
  getWindowCommandMetadata,
  addMenuCommandMetadata,
  getMenuCommandMetadata,
  addWindowEmitMetadata,
  getWindowEmitMetadata,
  getWindowEmitMetadataForMethod,
  addWindowRendererSubscriptionMetadata,
  getWindowRendererSubscriptionMetadata,
  addMenuRendererSubscriptionMetadata,
  getMenuRendererSubscriptionMetadata,
  addWindowMainSubscriptionMetadata,
  getWindowMainSubscriptionMetadata,
};
