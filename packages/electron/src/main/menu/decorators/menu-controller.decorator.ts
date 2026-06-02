import { createConstructorDecorator } from 'assemblerjs';
import { getAssemblageContext, getAssemblageDefinition } from 'assemblerjs';
import type { Identifier } from 'assemblerjs';
import {
  buildMenuTreeFromMetadata,
  mergeRootMenus,
  resolveMenuTranslate,
  type ElectronMenu,
  type ElectronMenuItem,
} from '@/main/menu/classes';
import { ElectronWindow } from '@/main/window/classes/electron-window';
import {
  AbstractMenuControllerService,
  MenuControllerService,
} from '@/main/menu/services';
import { getMenuContributionDefinition } from './menu-contribution.decorator';
import { getMenuDefinition } from './menu.decorator';

type MenuToken = Identifier<any>;

interface ManagedMenuDefinition {
  token: MenuToken;
  concrete: Function;
  definition: {
    window: string;
    name: string;
  };
}

interface ManagedMenuContributionDefinition {
  token: MenuToken;
  concrete: Function;
  definition: {
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
  };
}

interface ManagedRegisteredMenu {
  windowName: string;
  menuName: string;
  menu: ElectronMenu;
  baseItemStates: Record<
    string,
    {
      enabled: boolean;
      checked?: boolean;
    }
  >;
}

const managedMenusSymbol = Symbol('__MenuControllerManagedMenus__');
const managedContributionsSymbol = Symbol(
  '__MenuControllerManagedContributions__',
);
const registeredMenuWindowsSymbol = Symbol(
  '__MenuControllerRegisteredWindows__',
);
const registeredMenusSymbol = Symbol('__MenuControllerRegisteredMenus__');
const boundWindowInstancesSymbol = Symbol('__MenuControllerBoundWindows__');

function listManagedMenus(controller: any): ManagedMenuDefinition[] {
  if (!controller[managedMenusSymbol]) {
    controller[managedMenusSymbol] = [] as ManagedMenuDefinition[];
  }

  const managedMenus = controller[
    managedMenusSymbol
  ] as ManagedMenuDefinition[];
  if (managedMenus.length > 0) {
    return managedMenus;
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

    const token = injection[0] as MenuToken;
    const concrete = (injection[1] || injection[0]) as Function;
    const definition =
      getMenuDefinition(concrete) || getMenuDefinition(token as any);
    if (!definition) {
      continue;
    }

    managedMenus.push({
      token,
      concrete,
      definition,
    });
  }

  return managedMenus;
}

function listManagedContributions(
  controller: any,
): ManagedMenuContributionDefinition[] {
  if (!controller[managedContributionsSymbol]) {
    controller[managedContributionsSymbol] =
      [] as ManagedMenuContributionDefinition[];
  }

  const managedContributions = controller[
    managedContributionsSymbol
  ] as ManagedMenuContributionDefinition[];
  if (managedContributions.length > 0) {
    return managedContributions;
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

    const token = injection[0] as MenuToken;
    const concrete = (injection[1] || injection[0]) as Function;
    const definition =
      getMenuContributionDefinition(concrete) ||
      getMenuContributionDefinition(token as any);

    if (!definition) {
      continue;
    }

    managedContributions.push({
      token,
      concrete,
      definition,
    });
  }

  return managedContributions.sort(
    (a, b) => a.definition.priority - b.definition.priority,
  );
}

function ensureRegisteredMenus(controller: any): ManagedRegisteredMenu[] {
  if (!controller[registeredMenusSymbol]) {
    controller[registeredMenusSymbol] = [] as ManagedRegisteredMenu[];
  }

  return controller[registeredMenusSymbol] as ManagedRegisteredMenu[];
}

function ensureBoundWindowInstances(controller: any): WeakSet<object> {
  if (!controller[boundWindowInstancesSymbol]) {
    controller[boundWindowInstancesSymbol] = new WeakSet<object>();
  }

  return controller[boundWindowInstancesSymbol] as WeakSet<object>;
}

function collectMenuBaseItemStates(
  menu: ElectronMenu,
): ManagedRegisteredMenu['baseItemStates'] {
  const states: ManagedRegisteredMenu['baseItemStates'] = {};

  const visit = (items: ReadonlyArray<ElectronMenuItem>): void => {
    for (const item of items) {
      states[item.id] = {
        enabled: item.enabled,
        checked: item.checked,
      };

      if (item.submenu) {
        visit(item.submenu);
      }
    }
  };

  visit(menu.getItems());
  return states;
}

function registerManagedMenu(
  controller: any,
  menu: ElectronMenu,
  menuName: string,
  windowName: string,
): void {
  const registeredMenus = ensureRegisteredMenus(controller);
  const existing = registeredMenus.find(
    (entry) => entry.windowName === windowName && entry.menuName === menuName,
  );

  const next: ManagedRegisteredMenu = {
    windowName,
    menuName,
    menu,
    baseItemStates: collectMenuBaseItemStates(menu),
  };

  if (existing) {
    existing.menu = next.menu;
    existing.baseItemStates = next.baseItemStates;
    return;
  }

  registeredMenus.push(next);
}

function getFocusedWindowName(): string | undefined {
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

  if (!focusedWindow || focusedWindow.isDestroyed()) {
    return undefined;
  }

  return focusedWindow.name;
}

function applyMenuStateContributions(
  controller: any,
  menus: AbstractMenuControllerService,
  contributions: ManagedMenuContributionDefinition[],
): void {
  const stateEntries = contributions.flatMap((contribution) =>
    (contribution.definition.states || []).map((state) => ({
      target: contribution.definition.target,
      definition: state,
    })),
  );

  if (stateEntries.length === 0) {
    return;
  }

  const registeredMenus = ensureRegisteredMenus(controller);
  const focusedWindowName = getFocusedWindowName();

  for (const registeredMenu of registeredMenus) {
    const matching = stateEntries.filter(
      (entry) => entry.target === registeredMenu.menuName,
    );

    if (matching.length === 0) {
      continue;
    }

    const affectedItemIds = new Set<string>();
    for (const entry of matching) {
      affectedItemIds.add(entry.definition.itemId);
    }

    // Reset targeted items to the post-composition baseline before reapplying active states.
    for (const itemId of affectedItemIds) {
      const baseState = registeredMenu.baseItemStates[itemId];
      if (!baseState) {
        continue;
      }

      menus.setItemEnabled(
        registeredMenu.windowName,
        itemId,
        baseState.enabled,
      );

      if (typeof baseState.checked === 'boolean') {
        menus.setItemChecked(
          registeredMenu.windowName,
          itemId,
          baseState.checked,
        );
      }
    }

    for (const entry of matching) {
      if (
        entry.definition.whenWindowFocused &&
        entry.definition.whenWindowFocused !== focusedWindowName
      ) {
        continue;
      }

      if (typeof entry.definition.enabled === 'boolean') {
        menus.setItemEnabled(
          registeredMenu.windowName,
          entry.definition.itemId,
          entry.definition.enabled,
        );
      }

      if (typeof entry.definition.checked === 'boolean') {
        menus.setItemChecked(
          registeredMenu.windowName,
          entry.definition.itemId,
          entry.definition.checked,
        );
      }
    }
  }
}

function bindWindowForMenuStateContributions(
  controller: any,
  windowInstance: any,
  menus: AbstractMenuControllerService,
  contributions: ManagedMenuContributionDefinition[],
): void {
  if (
    !windowInstance ||
    typeof windowInstance.on !== 'function' ||
    contributions.length === 0
  ) {
    return;
  }

  const boundWindowInstances = ensureBoundWindowInstances(controller);
  if (boundWindowInstances.has(windowInstance)) {
    return;
  }

  const refresh = () => {
    applyMenuStateContributions(controller, menus, contributions);
  };

  windowInstance.on('focus', refresh);
  windowInstance.on('blur', refresh);
  windowInstance.on('closed', refresh);
  boundWindowInstances.add(windowInstance);
}

function applyMenuContributions(
  context: ReturnType<typeof getAssemblageContext>,
  menu: ElectronMenu,
  menuName: string,
  contributions: ManagedMenuContributionDefinition[],
): void {
  const matching = contributions.filter(
    (entry) => entry.definition.target === menuName,
  );

  if (matching.length === 0) {
    return;
  }

  const translate = resolveMenuTranslate(menu);
  const roots: ElectronMenuItem[] = [...menu.getItems()];

  for (const entry of matching) {
    const instance = context.require(entry.token as any) as object;
    const built = buildMenuTreeFromMetadata(instance || entry.concrete, {
      translate,
      pathFallback: entry.definition.path,
      declarationIndexOffset: entry.definition.priority * 10_000,
    });

    roots.push(...built.roots);
  }

  menu.replaceItems(mergeRootMenus(roots));
}

function resolveMenuControllerService(
  controller: any,
): AbstractMenuControllerService {
  if (
    controller.menus &&
    typeof controller.menus.registerMenu === 'function' &&
    typeof controller.menus.unregisterMenu === 'function'
  ) {
    return controller.menus as AbstractMenuControllerService;
  }

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

export const MenuController = createConstructorDecorator(function (this: any) {
  const context = getAssemblageContext(this.constructor);
  const menus = resolveMenuControllerService(this);
  const managed = listManagedMenus(this);
  const managedContributions = listManagedContributions(this);

  if (!this[registeredMenuWindowsSymbol]) {
    this[registeredMenuWindowsSymbol] = new Set<string>();
  }

  const registeredWindows = this[registeredMenuWindowsSymbol] as Set<string>;

  if (typeof this.openWindow === 'function') {
    const originalOpenWindow = this.openWindow.bind(this);
    this.openWindow = async (...args: any[]) => {
      const windowInstance = await originalOpenWindow(...args);
      bindWindowForMenuStateContributions(
        this,
        windowInstance,
        menus,
        managedContributions,
      );
      applyMenuStateContributions(this, menus, managedContributions);
      return windowInstance;
    };
  }

  const originalOnInit =
    typeof this.onInit === 'function' ? this.onInit.bind(this) : undefined;

  this.onInit = async (...args: any[]) => {
    if (originalOnInit) {
      await originalOnInit(...args);
    }

    for (const entry of managed) {
      const instance = context.require(entry.token as any) as ElectronMenu;
      applyMenuContributions(
        context,
        instance,
        entry.definition.name,
        managedContributions,
      );
      registerManagedMenu(
        this,
        instance,
        entry.definition.name,
        entry.definition.window,
      );
      menus.registerMenu(
        entry.definition.window,
        instance,
        entry.definition.name,
      );
      await menus.focus(entry.definition.window);
      registeredWindows.add(entry.definition.window);
    }

    const openWindows =
      typeof this.listWindows === 'function' ? this.listWindows() : [];
    for (const windowInstance of openWindows) {
      bindWindowForMenuStateContributions(
        this,
        windowInstance,
        menus,
        managedContributions,
      );
    }

    applyMenuStateContributions(this, menus, managedContributions);
  };

  const originalOnDispose =
    typeof this.onDispose === 'function'
      ? this.onDispose.bind(this)
      : undefined;

  this.onDispose = async (...args: any[]) => {
    ensureRegisteredMenus(this).length = 0;

    for (const windowName of registeredWindows) {
      menus.unregisterMenu(windowName);
    }
    registeredWindows.clear();

    if (originalOnDispose) {
      return await originalOnDispose(...args);
    }
  };
});
