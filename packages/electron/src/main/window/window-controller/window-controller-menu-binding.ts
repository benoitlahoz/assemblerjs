import { getAssemblageContext } from 'assemblerjs';
import { ElectronWindow } from '@/main/window/classes/electron-window';
import { getUseMenuDefinition } from '@/main/window-menu/decorators';
import {
  AbstractMenuRegistryService,
  AbstractWindowMenuBindingRegistryService,
  MenuRegistryService,
  WindowMenuBindingRegistryService,
} from '@/main/window-menu/services';
import {
  AbstractMenuControllerService,
  MenuControllerService,
} from '@/main/menu/services';
import type { MenuReference } from '@/main/window-menu/contracts';
import type { ManagedWindowDefinition } from './window-controller.types';

const boundMenuFocusWindows = new WeakSet<object>();
const fallbackBindingsSymbol = Symbol(
  '__WindowControllerFallbackMenuBindings__',
);

interface MenuBindingsLike {
  attach(windowName: string, menu: MenuReference): Promise<void>;
  detach(windowName: string): void;
  refresh(windowName: string): Promise<void>;
  has?(windowName: string): boolean;
}

type WindowMenuBindings = Pick<
  AbstractWindowMenuBindingRegistryService,
  'attach' | 'detach' | 'refresh'
> & {
  has?(windowName: string): boolean;
};

function resolveMenuController(controller: any): AbstractMenuControllerService {
  const context = getAssemblageContext(controller.constructor);

  try {
    return context.require(AbstractMenuControllerService);
  } catch {
    try {
      return context.require(MenuControllerService);
    } catch {
      return new MenuControllerService();
    }
  }
}

function resolveMenuReference(controller: any, reference: MenuReference): any {
  const context = getAssemblageContext(controller.constructor);

  if (typeof reference === 'function') {
    return context.require(reference as any);
  }

  try {
    return context.require(AbstractMenuRegistryService).resolveMenu(reference);
  } catch {
    try {
      return context.require(MenuRegistryService).resolveMenu(reference);
    } catch {
      throw new Error(
        `No menu registry available to resolve named menu '${reference}'. Provide AbstractMenuRegistryService or use class menu references with @UseMenu(MenuClass).`,
      );
    }
  }
}

function createFallbackBindings(controller: any): MenuBindingsLike {
  const entries = new Map<string, { menu: MenuReference }>();

  return {
    async attach(windowName: string, menu: MenuReference): Promise<void> {
      const current = entries.get(windowName);
      if (current && current.menu === menu) {
        return;
      }

      const menus = resolveMenuController(controller);
      const menuInstance = resolveMenuReference(controller, menu);

      menus.registerMenu(windowName, menuInstance);
      await menus.focus(windowName);

      entries.set(windowName, { menu });
    },
    detach(windowName: string): void {
      const current = entries.get(windowName);
      if (!current) {
        return;
      }

      const menus = resolveMenuController(controller);
      menus.unregisterMenu(windowName);
      entries.delete(windowName);

      const focusedWindow =
        typeof (
          ElectronWindow as typeof ElectronWindow & {
            getFocusedWindow?: () => ElectronWindow | null;
          }
        ).getFocusedWindow === 'function'
          ? (
              ElectronWindow as typeof ElectronWindow & {
                getFocusedWindow: () => ElectronWindow | null;
              }
            ).getFocusedWindow()
          : null;

      const focusedWindowName = (
        focusedWindow as ElectronWindow & { name?: string }
      )?.name;
      if (focusedWindowName && entries.has(focusedWindowName)) {
        void menus.focus(focusedWindowName);
      }
    },
    async refresh(windowName: string): Promise<void> {
      if (!entries.has(windowName)) {
        return;
      }

      const menus = resolveMenuController(controller);
      await menus.focus(windowName);
    },
    has(windowName: string): boolean {
      return entries.has(windowName);
    },
  };
}

function resolveWindowMenuBindings(
  controller: any,
): WindowMenuBindings | undefined {
  const context = getAssemblageContext(controller.constructor);

  try {
    return context.require(AbstractWindowMenuBindingRegistryService);
  } catch {
    try {
      return context.require(WindowMenuBindingRegistryService);
    } catch {
      if (!controller[fallbackBindingsSymbol]) {
        controller[fallbackBindingsSymbol] = createFallbackBindings(controller);
      }

      return controller[fallbackBindingsSymbol] as MenuBindingsLike;
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
