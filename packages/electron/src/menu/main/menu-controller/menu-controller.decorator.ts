import { createConstructorDecorator } from 'assemblerjs';
import { getAssemblageContext, getAssemblageDefinition } from 'assemblerjs';
import type { Identifier } from 'assemblerjs';
import type { ElectronMenu } from '@/menu/main/model/electron-menu';
import {
  BaseMenuController,
  resolveBaseMenuController,
} from '@/menu/main/services';
import { getMenuDefinition } from '@/menu/main/menu-definition/menu.decorator';
import {
  AbstractMenuRegistryService,
  MenuRegistryService,
} from '@/window-menu/main/services';

type MenuToken = Identifier<any>;

interface ManagedMenuDefinition {
  token: MenuToken;
  concrete: Function;
  definition: {
    name: string;
    global: boolean;
  };
}

const managedMenusSymbol = Symbol('__MenuControllerManagedMenus__');

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

function resolveMenuControllerService(controller: any): BaseMenuController {
  return resolveBaseMenuController(controller);
}

function resolveMenuRegistryService(
  controller: any,
): AbstractMenuRegistryService | undefined {
  const context = getAssemblageContext(controller.constructor);

  try {
    return context.require(AbstractMenuRegistryService);
  } catch {
    try {
      return context.require(MenuRegistryService);
    } catch {
      return undefined;
    }
  }
}

export const MenuController = createConstructorDecorator(function (this: any) {
  const context = getAssemblageContext(this.constructor);
  const menus = resolveMenuControllerService(this);
  const managedMenus = listManagedMenus(this);

  const originalOnInit =
    typeof this.onInit === 'function' ? this.onInit.bind(this) : undefined;

  this.onInit = async (...args: any[]) => {
    if (originalOnInit) {
      await originalOnInit(...args);
    }

    const menuRegistry = resolveMenuRegistryService(this);

    for (const entry of managedMenus) {
      const menu = context.require(entry.token as any) as ElectronMenu;

      if (entry.definition.global) {
        await menus.registerGlobalMenu(menu, entry.definition.name);
      }

      if (
        menuRegistry &&
        typeof menuRegistry.has === 'function' &&
        typeof menuRegistry.register === 'function' &&
        !menuRegistry.has(entry.definition.name)
      ) {
        menuRegistry.register(entry.definition.name, {
          reference: entry.token as any,
        });
      }
    }
  };

  const originalOnDispose =
    typeof this.onDispose === 'function'
      ? this.onDispose.bind(this)
      : undefined;

  this.onDispose = async (...args: any[]) => {
    menus.unregisterGlobalMenu();

    if (typeof this.listWindows === 'function') {
      const windows = this.listWindows() as Array<{
        id?: number;
        name: string;
      }>;
      for (const window of windows) {
        menus.unregisterMenu(
          typeof window.id === 'number' ? String(window.id) : window.name,
        );
      }
    } else if (typeof this.listWindowNames === 'function') {
      const names = this.listWindowNames() as string[];
      for (const windowName of names) {
        menus.unregisterMenu(windowName);
      }
    }

    if (originalOnDispose) {
      return await originalOnDispose(...args);
    }
  };
});
