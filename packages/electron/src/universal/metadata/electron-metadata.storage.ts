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

export interface MenuContributionDefinitionMetadata {
  target: string;
  priority: number;
  path?: string;
  states?: Array<{
    itemId: string;
    priority: number;
    enabled?: boolean;
    checked?: boolean;
    whenWindowFocused?: string;
  }>;
}

export interface MenuFragmentDefinitionMetadata {
  enabled: true;
  path?: string;
}

export interface MenuItemLabelResolverContext {
  itemId: string;
  path: string;
  method: string;
  source?: object;
  target: Function;
  translate: (key: string) => string;
}

export type MenuItemLabelValue =
  | string
  | ((this: any, context?: MenuItemLabelResolverContext) => string | undefined);

interface WindowCommandMetadataEntry {
  method: string;
  command: string;
}

interface MenuCommandMetadataEntry {
  method: string;
  command: string;
}

interface MenuItemHandleInMainMetadataEntry {
  method: string;
}

interface MenuItemForwardToRendererMetadataEntry {
  method: string;
}

export interface MenuItemMetadataEntry {
  method: string;
  id: string;
  path?: string;
  label?: MenuItemLabelValue;
  type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio';
  checked?: boolean;
  enabled?: boolean;
  role?: string;
  accelerator?: string;
  order?: number;
  before?: string;
  after?: string;
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
  MenuContributionDefinition: 'menu.contribution.definition',
  MenuFragmentDefinition: 'menu.fragment.definition',
  WindowRendererDefinition: 'window.renderer.definition',
  MenuRendererDefinition: 'menu.renderer.definition',
  WindowCommand: 'window.command',
  MenuCommand: 'menu.command',
  WindowEmit: 'window.emit',
  MenuItem: 'menu.item',
  MenuItemHandleInMain: 'menu.item.handle-in-main',
  MenuItemForwardToRenderer: 'menu.item.forward-to-renderer',
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

export function setMenuContributionDefinitionMetadata(
  target: Function,
  definition: MenuContributionDefinitionMetadata,
): void {
  electronMetadata.setClass(
    ElectronMetadataNames.MenuContributionDefinition,
    target,
    definition,
  );
}

export function getMenuContributionDefinitionMetadata(
  target: Function,
): MenuContributionDefinitionMetadata | undefined {
  return electronMetadata.getClass(
    ElectronMetadataNames.MenuContributionDefinition,
    target,
  );
}

export function setMenuFragmentDefinitionMetadata(
  target: Function,
  definition: MenuFragmentDefinitionMetadata,
): void {
  electronMetadata.setClass(
    ElectronMetadataNames.MenuFragmentDefinition,
    target,
    definition,
  );
}

export function getMenuFragmentDefinitionMetadata(
  target: Function,
): MenuFragmentDefinitionMetadata | undefined {
  return electronMetadata.getClass(
    ElectronMetadataNames.MenuFragmentDefinition,
    target,
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

export function addMenuItemMetadata(
  target: object,
  method: string,
  item: Omit<MenuItemMetadataEntry, 'method'>,
): void {
  electronMetadata.addMethodEntry(
    ElectronMetadataNames.MenuItem,
    target,
    method,
    { method, ...item } as MenuItemMetadataEntry,
  );
}

export function getMenuItemMetadata(target: Function): MenuItemMetadataEntry[] {
  return uniqueByMethod(
    electronMetadata.getMethodEntries<MenuItemMetadataEntry>(
      ElectronMetadataNames.MenuItem,
      target,
    ),
  );
}

export function addMenuItemHandleInMainMetadata(
  target: object,
  method: string,
): void {
  electronMetadata.addMethodEntry(
    ElectronMetadataNames.MenuItemHandleInMain,
    target,
    method,
    { method } as MenuItemHandleInMainMetadataEntry,
  );
}

export function getMenuItemHandleInMainMetadata(
  target: Function,
): MenuItemHandleInMainMetadataEntry[] {
  return uniqueByMethod(
    electronMetadata.getMethodEntries<MenuItemHandleInMainMetadataEntry>(
      ElectronMetadataNames.MenuItemHandleInMain,
      target,
    ),
  );
}

export function addMenuItemForwardToRendererMetadata(
  target: object,
  method: string,
): void {
  electronMetadata.addMethodEntry(
    ElectronMetadataNames.MenuItemForwardToRenderer,
    target,
    method,
    { method } as MenuItemForwardToRendererMetadataEntry,
  );
}

export function getMenuItemForwardToRendererMetadata(
  target: Function,
): MenuItemForwardToRendererMetadataEntry[] {
  return uniqueByMethod(
    electronMetadata.getMethodEntries<MenuItemForwardToRendererMetadataEntry>(
      ElectronMetadataNames.MenuItemForwardToRenderer,
      target,
    ),
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
  setMenuContributionDefinitionMetadata,
  getMenuDefinitionMetadata,
  getMenuContributionDefinitionMetadata,
  setMenuFragmentDefinitionMetadata,
  getMenuFragmentDefinitionMetadata,
  setWindowRendererDefinitionMetadata,
  getWindowRendererDefinitionMetadata,
  setMenuRendererDefinitionMetadata,
  getMenuRendererDefinitionMetadata,
  addWindowCommandMetadata,
  getWindowCommandMetadata,
  addMenuCommandMetadata,
  getMenuCommandMetadata,
  addMenuItemMetadata,
  getMenuItemMetadata,
  addMenuItemHandleInMainMetadata,
  getMenuItemHandleInMainMetadata,
  addMenuItemForwardToRendererMetadata,
  getMenuItemForwardToRendererMetadata,
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
