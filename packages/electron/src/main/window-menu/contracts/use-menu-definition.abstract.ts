import type { Identifier } from 'assemblerjs';

export type MenuReference = Identifier<any> | string;

export interface UseMenuDefinition {
  menu: MenuReference;
  layout?: Identifier<any>;
  state?: Identifier<any>;
}

export interface NormalizedUseMenuDefinition {
  menu: MenuReference;
  layout?: Identifier<any>;
  state?: Identifier<any>;
}

export function normalizeUseMenuDefinition(
  definition: MenuReference | UseMenuDefinition,
): NormalizedUseMenuDefinition {
  if (typeof definition === 'string' || typeof definition === 'function') {
    return {
      menu: definition,
    };
  }

  if (!definition || typeof definition !== 'object') {
    throw new Error(
      '@UseMenu requires a menu reference or a valid definition object.',
    );
  }

  const menu = definition.menu;
  if (typeof menu !== 'string' && typeof menu !== 'function') {
    throw new Error(
      '@UseMenu requires a valid menu reference (token or string name).',
    );
  }

  const { layout, state } = definition;

  return {
    menu,
    layout: typeof layout === 'function' ? layout : undefined,
    state: typeof state === 'function' ? state : undefined,
  };
}
