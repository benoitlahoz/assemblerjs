import { getAssemblageContext } from 'assemblerjs';
import { getUseMenuDefinition } from '@/main/window-menu/decorators';
import {
  AbstractWindowMenuBindingRegistryService,
  WindowMenuBindingRegistryService,
} from '@/main/window-menu/services';
import type { ManagedWindowDefinition } from './window-controller.types';

const boundMenuFocusWindows = new WeakSet<object>();

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
  windowInstance?: any,
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

  if (
    windowInstance &&
    typeof windowInstance.on === 'function' &&
    !boundMenuFocusWindows.has(windowInstance)
  ) {
    const refreshMenu = () => {
      void bindings.refresh(managed.definition.name);
    };

    windowInstance.on('focus', refreshMenu);
    windowInstance.on('show', refreshMenu);
    boundMenuFocusWindows.add(windowInstance);
  }
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
