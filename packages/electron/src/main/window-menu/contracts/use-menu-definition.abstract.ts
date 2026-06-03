import type { Identifier } from 'assemblerjs';

export type MenuReference = Identifier<any> | string;

export interface UseMenuItemOverride {
  enabled?: boolean;
  visible?: boolean;
  checked?: boolean;
}

export interface UseMenuSlotOptions {
  id?: string;
  order?: number;
  label?: string;
  items?: Record<string, UseMenuItemOverride>;
}

export type UseMenuSlot =
  | Identifier<any>
  | [Identifier<any>, UseMenuSlotOptions];

export interface NormalizedUseMenuSlot {
  token: Identifier<any>;
  options?: UseMenuSlotOptions;
}

export interface UseMenuDefinition {
  menu?: MenuReference;
  slots?: UseMenuSlot[];
  layout?: Identifier<any>;
  state?: Identifier<any>;
}

export interface NormalizedUseMenuDefinition {
  menu?: MenuReference;
  slots?: NormalizedUseMenuSlot[];
  layout?: Identifier<any>;
  state?: Identifier<any>;
}

function normalizeSlot(slot: UseMenuSlot): NormalizedUseMenuSlot {
  if (typeof slot === 'function') {
    return { token: slot };
  }

  if (Array.isArray(slot)) {
    const [token, options] = slot as [Identifier<any>, UseMenuSlotOptions];
    return { token, options };
  }

  throw new Error(
    '@UseMenu slot must be a class reference or a [Class, options] tuple.',
  );
}

export function normalizeUseMenuDefinition(
  definition: MenuReference | UseMenuDefinition | UseMenuSlot[],
): NormalizedUseMenuDefinition {
  // Array of slots (composition form)
  if (Array.isArray(definition)) {
    return {
      slots: definition.map(normalizeSlot),
    };
  }

  // Single class reference or string name
  if (typeof definition === 'string' || typeof definition === 'function') {
    return {
      menu: definition,
    };
  }

  if (!definition || typeof definition !== 'object') {
    throw new Error(
      '@UseMenu requires a menu reference, a valid definition object, or a slots array.',
    );
  }

  const def = definition as UseMenuDefinition;

  // Slots form via object
  if (def.slots) {
    return {
      slots: def.slots.map(normalizeSlot),
      layout: typeof def.layout === 'function' ? def.layout : undefined,
      state: typeof def.state === 'function' ? def.state : undefined,
    };
  }

  // Single menu via object
  const menu = def.menu;
  if (!menu) {
    throw new Error(
      '@UseMenu definition must provide either "menu" or "slots".',
    );
  }

  if (typeof menu !== 'string' && typeof menu !== 'function') {
    throw new Error(
      '@UseMenu requires a valid menu reference (token or string name).',
    );
  }

  const { layout, state } = def;

  return {
    menu,
    layout: typeof layout === 'function' ? layout : undefined,
    state: typeof state === 'function' ? state : undefined,
  };
}
