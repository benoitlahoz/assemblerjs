import { getAssemblageContext } from 'assemblerjs';
import { ElectronWindow } from '@/window/main/classes/electron-window';
import { ElectronMenu } from '@/menu/main/model/electron-menu';
import { assembleMenuFromSlots } from '@/menu/main/builders/assemble-menu-from-slots';
import { getUseMenuDefinition } from '@/window-menu/main/decorators';
import {
  AbstractMenuRegistryService,
  MenuRegistryService,
} from '@/window-menu/main/services';
import {
  BaseMenuController,
  resolveBaseMenuController,
} from '@/menu/main/services';
import type { MenuReference } from '@/window-menu/main/contracts';
import type { ManagedWindowDefinition } from './window-controller.types';

const boundMenuFocusWindows = new WeakSet<object>();
const fallbackBindingsSymbol = Symbol(
  '__WindowControllerFallbackMenuBindings__',
);

function getWindowMenuScope(windowName: string, windowInstance?: any): string {
  return typeof windowInstance?.id === 'number'
    ? String(windowInstance.id)
    : windowName;
}

function resolveBestWindowScopeForBindings(
  bindings: WindowMenuBindings,
): string | undefined {
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

  if (focusedWindow && bindings.has?.(String(focusedWindow.id))) {
    return String(focusedWindow.id);
  }

  const listNames =
    typeof (bindings as MenuBindingsLike).listNames === 'function'
      ? (bindings as MenuBindingsLike).listNames!()
      : [];

  for (const scope of listNames) {
    const numericId = Number(scope);
    const candidate = Number.isInteger(numericId)
      ? ElectronWindow.getById(numericId)
      : ElectronWindow.getByName(scope);
    if (candidate && !candidate.isDestroyed()) {
      return scope;
    }
  }

  return undefined;
}

interface MenuBindingsLike {
  attach(
    windowName: string,
    menu: MenuReference | ElectronMenu,
    windowInstance?: any,
  ): Promise<void>;
  detach(windowName: string): void;
  refresh(windowName: string): Promise<void>;
  has?(windowName: string): boolean;
  listNames?(): string[];
}

type WindowMenuBindings = Pick<
  MenuBindingsLike,
  'attach' | 'detach' | 'refresh'
> & {
  has?(windowName: string): boolean;
};

function resolveMenuController(controller: any): BaseMenuController {
  return resolveBaseMenuController(controller);
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

  const isMissingMenuRegistrationError = (error: unknown): boolean => {
    return (
      error instanceof Error &&
      error.message.startsWith('No menu registered for window')
    );
  };

  const focusMenuSafely = async (windowName: string): Promise<void> => {
    const menus = resolveMenuController(controller);

    try {
      await menus.focus(windowName);
    } catch (error) {
      if (!isMissingMenuRegistrationError(error)) {
        throw error;
      }
    }
  };

  const resolveFocusedWindowName = (): string | undefined => {
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
      return focusedWindowName;
    }

    return undefined;
  };

  const resolveFallbackWindowName = (): string | undefined => {
    for (const windowName of entries.keys()) {
      const candidate = ElectronWindow.getByName(windowName);
      if (candidate && !candidate.isDestroyed()) {
        return windowName;
      }
    }

    return undefined;
  };

  const refreshBestAvailableWindowMenu = (): void => {
    const target = resolveFocusedWindowName() || resolveFallbackWindowName();

    if (!target) {
      return;
    }

    void focusMenuSafely(target);
  };

  return {
    async attach(
      windowName: string,
      menu: MenuReference | ElectronMenu,
      windowInstance?: any,
    ): Promise<void> {
      const current = entries.get(windowName);
      if (current && current.menu === menu) {
        return;
      }

      const menus = resolveMenuController(controller);
      const menuInstance =
        menu instanceof ElectronMenu
          ? menu
          : resolveMenuReference(controller, menu as MenuReference);

      menus.registerMenu(windowName, menuInstance, 'mainMenu', windowInstance);
      await menus.focus(windowName);

      entries.set(windowName, {
        menu:
          menu instanceof ElectronMenu ? windowName : (menu as MenuReference),
      });
    },
    detach(windowName: string): void {
      const current = entries.get(windowName);
      if (!current) {
        return;
      }

      const menus = resolveMenuController(controller);
      menus.unregisterMenu(windowName);
      entries.delete(windowName);

      refreshBestAvailableWindowMenu();
    },
    async refresh(windowName: string): Promise<void> {
      if (!entries.has(windowName)) {
        return;
      }

      await focusMenuSafely(windowName);
    },
    has(windowName: string): boolean {
      return entries.has(windowName);
    },
    listNames(): string[] {
      return [...entries.keys()];
    },
  };
}

function resolveWindowMenuBindings(
  controller: any,
): WindowMenuBindings | undefined {
  if (!controller[fallbackBindingsSymbol]) {
    controller[fallbackBindingsSymbol] = createFallbackBindings(controller);
  }

  return controller[fallbackBindingsSymbol] as MenuBindingsLike;
}

export async function attachManagedWindowMenu(
  controller: any,
  managed: ManagedWindowDefinition,
  windowInstance?: any,
): Promise<void> {
  const definition =
    getUseMenuDefinition(managed.concrete) ||
    getUseMenuDefinition(managed.token as unknown as Function);

  if (!definition?.menu && !definition?.slots) {
    return;
  }

  const bindings = resolveWindowMenuBindings(controller);
  if (!bindings) {
    return;
  }

  let menuToAttach: MenuReference | ElectronMenu;
  if (definition.slots && definition.slots.length > 0) {
    const context = getAssemblageContext(controller.constructor);
    menuToAttach = assembleMenuFromSlots(definition.slots, (token) =>
      context.require(token),
    );
  } else {
    menuToAttach = definition.menu!;
  }

  const menuScope = getWindowMenuScope(managed.definition.name, windowInstance);
  await bindings.attach(menuScope, menuToAttach, windowInstance);

  if (
    windowInstance &&
    typeof windowInstance.on === 'function' &&
    !boundMenuFocusWindows.has(windowInstance)
  ) {
    const refreshMenu = () => {
      void bindings.refresh(menuScope).catch(() => undefined);
    };

    const refreshAfterTransition = () => {
      queueMicrotask(() => {
        const bestWindowScope = resolveBestWindowScopeForBindings(bindings);
        if (!bestWindowScope) {
          return;
        }

        void bindings.refresh(bestWindowScope).catch(() => undefined);
      });
    };

    windowInstance.on('focus', refreshMenu);
    windowInstance.on('show', refreshMenu);
    windowInstance.on('blur', refreshAfterTransition);
    windowInstance.on('closed', refreshAfterTransition);
    boundMenuFocusWindows.add(windowInstance);
  }
}

export function detachManagedWindowMenu(
  controller: any,
  managed: ManagedWindowDefinition,
  windowInstance?: any,
): void {
  const bindings = resolveWindowMenuBindings(controller);
  if (!bindings) {
    return;
  }

  bindings.detach(getWindowMenuScope(managed.definition.name, windowInstance));
}
