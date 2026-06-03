import {
  createConstructorDecorator,
  getAssemblageDefinition,
} from 'assemblerjs';
import { buildMenuTreeFromMetadata } from '@/main/menu/builders/build-menu-tree-from-metadata';
import {
  mergeRootMenus,
  resolveMenuTranslate,
} from '@/main/menu/builders/compose-menu-roots';
import type { ElectronMenuItem } from '@/main/menu/model/electron-menu-item';
import {
  ElectronMetadataStorage,
  getMenuDefinitionMetadata,
  setMenuDefinitionMetadata,
} from '@/universal/metadata';

export interface MenuDefinition {
  name?: string;
}

export interface NormalizedMenuDefinition {
  name: string;
}

export const MenuDefinitionMetadataKey =
  ElectronMetadataStorage.getKey('MenuDefinition');

const MenuAutoBootstrap = createConstructorDecorator(function (this: any) {
  if (typeof this.getItems === 'function' && this.getItems().length > 0) {
    return;
  }

  if (typeof this.registerItem !== 'function') {
    return;
  }

  const roots: ElectronMenuItem[] = [];
  const translate = resolveMenuTranslate(this);

  roots.push(...buildMenuTreeFromMetadata(this, { translate }).roots);

  for (const root of mergeRootMenus(roots)) {
    this.registerItem(root);
  }
});

export function normalizeMenuDefinition(
  definition: string | MenuDefinition,
): NormalizedMenuDefinition {
  if (typeof definition === 'string') {
    throw new Error(
      '@Menu no longer accepts a window name string. Use @Menu({ name }) and bind windows with @UseMenu.',
    );
  }

  if (!definition || typeof definition !== 'object') {
    throw new Error('@Menu requires a valid definition object.');
  }

  const raw = definition as Record<string, unknown>;
  if (typeof raw.window !== 'undefined') {
    throw new Error(
      '@Menu.window has been removed. Bind windows to menus with @UseMenu instead.',
    );
  }

  if (typeof raw.fragments !== 'undefined') {
    throw new Error(
      '@Menu.fragments has been removed. Compose menu trees with @SubMenu and injected assemblages.',
    );
  }

  return {
    name:
      definition.name && typeof definition.name === 'string'
        ? definition.name
        : 'mainMenu',
  };
}

/**
 * Marks an assemblage as a managed menu definition.
 */
export function Menu(definition: string | MenuDefinition): ClassDecorator {
  return (target: Function) => {
    const normalized = normalizeMenuDefinition(definition);
    const autoBootstrapDecorator = MenuAutoBootstrap();
    const decoratedTarget =
      (autoBootstrapDecorator(target as any) as Function | void) || target;

    setMenuDefinitionMetadata(target, normalized);
    if (decoratedTarget !== target) {
      setMenuDefinitionMetadata(decoratedTarget, normalized);
    }

    const targets =
      decoratedTarget === target ? [target] : [target, decoratedTarget];

    for (const entryTarget of targets) {
      const assemblageDefinition = getAssemblageDefinition(entryTarget as any);
      if (
        assemblageDefinition &&
        assemblageDefinition.singleton === undefined
      ) {
        assemblageDefinition.singleton = true;
      }
    }

    return decoratedTarget as any;
  };
}

export function getMenuDefinition(
  target: Function,
): NormalizedMenuDefinition | undefined {
  return getMenuDefinitionMetadata(target) as
    | NormalizedMenuDefinition
    | undefined;
}
