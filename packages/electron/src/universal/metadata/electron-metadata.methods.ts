import {
  electronMetadata,
  resolveConstructor,
  uniqueByMethod,
} from './electron-metadata.shared';
import { ElectronMetadataNames } from './electron-metadata.names';
import type {
  MenuItemMetadataEntry,
  MenuRendererSubscriptionMetadata,
  RendererIpcSubscriptionType,
  WindowMainSubscriptionMetadata,
  WindowRendererSubscriptionMetadata,
} from './electron-metadata.types';

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
