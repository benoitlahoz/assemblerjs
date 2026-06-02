import { getAssemblageContext } from 'assemblerjs';
import { getUseMenuDefinition } from '@/main/window-menu/decorators';
import {
  AbstractWindowMenuBindingRegistryService,
  WindowMenuBindingRegistryService,
} from '@/main/window-menu/services';
import type { ManagedWindowDefinition } from './window-controller.types';

function resolveWindowMenuBindings(
  controller: any,
): AbstractWindowMenuBindingRegistryService | undefined {
  const context = getAssemblageContext(controller.constructor);

  try {
    return context.require(AbstractWindowMenuBindingRegistryService);
  } catch {
    try {
      return context.require(WindowMenuBindingRegistryService);
    } catch {
      return undefined;
    }
  }
}

export async function attachManagedWindowMenu(
  controller: any,
  managed: ManagedWindowDefinition,
): Promise<void> {
  const definition =
    getUseMenuDefinition(managed.concrete) ||
    getUseMenuDefinition(managed.token as unknown as Function);

  if (!definition?.menu) {
    return;
  }

  const bindings = resolveWindowMenuBindings(controller);
  if (!bindings) {
    return;
  }

  await bindings.attach(managed.definition.name, definition.menu);
}

export function detachManagedWindowMenu(
  controller: any,
  managed: ManagedWindowDefinition,
): void {
  const bindings = resolveWindowMenuBindings(controller);
  if (!bindings) {
    return;
  }

  bindings.detach(managed.definition.name);
}
