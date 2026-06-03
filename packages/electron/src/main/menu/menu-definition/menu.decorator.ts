import {
  createConstructorDecorator,
  getAssemblageContext,
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
  getMenuFragmentDefinitionMetadata,
  getMenuDefinitionMetadata,
  setMenuDefinitionMetadata,
} from '@/universal/metadata';

export interface MenuDefinition {
  name?: string;
  fragments?: any[];
}

export interface NormalizedMenuDefinition {
  name: string;
  fragments: any[];
}

export const MenuDefinitionMetadataKey =
  ElectronMetadataStorage.getKey('MenuDefinition');

interface MenuFragmentSource {
  token: any;
  target: Function;
  provideIndex: number;
  pathFallback?: string;
  instance?: object;
}

function resolveFragmentTarget(
  token: any,
  concrete: any,
): Function | undefined {
  if (
    typeof concrete === 'function' &&
    getMenuFragmentDefinitionMetadata(concrete)
  ) {
    return concrete;
  }

  if (typeof token === 'function' && getMenuFragmentDefinitionMetadata(token)) {
    return token;
  }

  return undefined;
}

function resolveMenuFragments(menuInstance: any): MenuFragmentSource[] {
  const menuCtor = menuInstance.constructor as new (...args: any[]) => unknown;
  const assemblageDefinition = getAssemblageDefinition(menuCtor) || {};
  const menuDefinition = getMenuDefinitionMetadata(menuCtor) as
    | NormalizedMenuDefinition
    | undefined;
  const provide = (assemblageDefinition.provide ||
    assemblageDefinition.inject ||
    []) as unknown as Array<any[]>;

  if (!Array.isArray(provide) || provide.length === 0) {
    return [];
  }

  let context: ReturnType<typeof getAssemblageContext> | undefined;
  try {
    context = getAssemblageContext(menuCtor);
  } catch {
    context = undefined;
  }

  const fragments: MenuFragmentSource[] = [];
  const seenTargets = new Set<Function>();

  for (let index = 0; index < provide.length; index += 1) {
    const injection = provide[index];
    if (!Array.isArray(injection) || injection.length === 0) {
      continue;
    }

    const token = injection[0];
    const concrete = injection[1] || injection[0];
    const target = resolveFragmentTarget(token, concrete);
    if (!target || seenTargets.has(target)) {
      continue;
    }

    if (getMenuDefinitionMetadata(target)) {
      throw new Error(
        `Menu fragment '${target.name || 'anonymous'}' cannot also be decorated with @Menu.`,
      );
    }

    let instance: object | undefined;
    if (context) {
      try {
        instance = context.require(token);
      } catch {
        instance = undefined;
      }
    }

    fragments.push({
      token,
      target,
      provideIndex: index,
      pathFallback: getMenuFragmentDefinitionMetadata(target)?.path,
      instance,
    });
    seenTargets.add(target);
  }

  const fragmentOrder =
    menuDefinition && Array.isArray(menuDefinition.fragments)
      ? menuDefinition.fragments
      : [];

  if (fragmentOrder.length === 0) {
    return fragments.sort((a, b) => a.provideIndex - b.provideIndex);
  }

  const orderIndex = new Map<any, number>();
  fragmentOrder.forEach((entry, index) => {
    orderIndex.set(entry, index);
  });

  return fragments.sort((a, b) => {
    const aOrder = orderIndex.get(a.token) ?? orderIndex.get(a.target);
    const bOrder = orderIndex.get(b.token) ?? orderIndex.get(b.target);

    if (typeof aOrder === 'number' && typeof bOrder === 'number') {
      return aOrder - bOrder;
    }

    if (typeof aOrder === 'number') {
      return -1;
    }

    if (typeof bOrder === 'number') {
      return 1;
    }

    return a.provideIndex - b.provideIndex;
  });
}

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

  for (const [fragmentIndex, fragment] of resolveMenuFragments(
    this,
  ).entries()) {
    roots.push(
      ...buildMenuTreeFromMetadata(fragment.instance || fragment.target, {
        translate,
        pathFallback: fragment.pathFallback,
        declarationIndexOffset: (fragmentIndex + 1) * 10_000,
      }).roots,
    );
  }

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

  return {
    name:
      definition.name && typeof definition.name === 'string'
        ? definition.name
        : 'mainMenu',
    fragments: Array.isArray(definition.fragments) ? definition.fragments : [],
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
