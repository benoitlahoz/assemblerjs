import { createConstructorDecorator } from 'assemblerjs';
import { getAssemblageContext, getAssemblageDefinition } from 'assemblerjs';
import type { Identifier } from 'assemblerjs';
import type { ElectronMenu } from '@/main/menu/classes';
import {
  AbstractMenuControllerService,
  MenuControllerService,
} from '@/main/menu/services';
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

const managedMenusSymbol = Symbol('__MenuControllerManagedMenus__');
const registeredMenuWindowsSymbol = Symbol(
  '__MenuControllerRegisteredWindows__',
);

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

  if (!this[registeredMenuWindowsSymbol]) {
    this[registeredMenuWindowsSymbol] = new Set<string>();
  }

  const registeredWindows = this[registeredMenuWindowsSymbol] as Set<string>;

  const originalOnInit =
    typeof this.onInit === 'function' ? this.onInit.bind(this) : undefined;

  this.onInit = async (...args: any[]) => {
    if (originalOnInit) {
      await originalOnInit(...args);
    }

    for (const entry of managed) {
      const instance = context.require(entry.token as any) as ElectronMenu;
      menus.registerMenu(
        entry.definition.window,
        instance,
        entry.definition.name,
      );
      await menus.focus(entry.definition.window);
      registeredWindows.add(entry.definition.window);
    }
  };

  const originalOnDispose =
    typeof this.onDispose === 'function'
      ? this.onDispose.bind(this)
      : undefined;

  this.onDispose = async (...args: any[]) => {
    for (const windowName of registeredWindows) {
      menus.unregisterMenu(windowName);
    }
    registeredWindows.clear();

    if (originalOnDispose) {
      return await originalOnDispose(...args);
    }
  };
});
