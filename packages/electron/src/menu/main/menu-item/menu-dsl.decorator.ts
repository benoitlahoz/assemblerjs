const menuNodeLabelKey = Symbol('electron:menu:dsl:node-label');
const menuNodeSubmenusKey = Symbol('electron:menu:dsl:submenus');
// Stores the names of the members (methods/properties) that must be preceded
// by a separator.
const menuSeparatorKey = Symbol('electron:menu:dsl:separators');

type SubMenuLabelValue =
  | string
  | ((this: any, ...args: any[]) => string | undefined);

export interface SubMenuDefinition {
  id?: string;
  label?: SubMenuLabelValue;
  order?: number;
  before?: string;
  after?: string;
}

interface DslSubmenuMetadata {
  member: string;
  source: 'property' | 'method';
  label?: SubMenuLabelValue;
  id?: string;
  order?: number;
  before?: string;
  after?: string;
  targetResolver?: () => Function;
}

function getTargetCtor(target: object | Function): Function {
  return typeof target === 'function'
    ? target
    : (target as { constructor: Function }).constructor;
}

function getStoredSubmenus(target: Function): DslSubmenuMetadata[] {
  return (
    (Reflect.getMetadata(menuNodeSubmenusKey, target) as
      | DslSubmenuMetadata[]
      | undefined) ?? []
  );
}

// Returns the members flagged with @MenuSeparator as a Set for fast lookups.
function getStoredSeparators(target: Function): Set<string> {
  return new Set(
    (Reflect.getMetadata(menuSeparatorKey, target) as string[] | undefined) ??
      [],
  );
}

export function setMenuNodeLabel(target: Function, label: string): void {
  if (typeof label !== 'string' || label.trim().length === 0) {
    throw new Error(
      '@MenuItem (class usage) requires a non-empty group label.',
    );
  }

  Reflect.defineMetadata(menuNodeLabelKey, label.trim(), target);
}

export function getMenuNodeLabel(target: Function): string | undefined {
  const raw = Reflect.getMetadata(menuNodeLabelKey, target);
  if (typeof raw !== 'string') {
    return undefined;
  }

  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function hasMenuDslMetadata(target: Function): boolean {
  return (
    typeof getMenuNodeLabel(target) === 'string' ||
    getStoredSubmenus(target).length > 0 ||
    // A class that only uses @MenuSeparator must still go through the DSL
    // path, otherwise its separators would be silently ignored.
    hasMenuSeparators(target)
  );
}

function isSubMenuDefinition(value: unknown): value is SubMenuDefinition {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function SubMenu(definition: SubMenuDefinition): MethodDecorator;
export function SubMenu(
  labelOrResolver?: string | (() => Function),
  resolver?: () => Function,
): PropertyDecorator;
export function SubMenu(
  definitionOrLabelOrResolver?: SubMenuDefinition | string | (() => Function),
  resolver?: () => Function,
): PropertyDecorator | MethodDecorator {
  if (isSubMenuDefinition(definitionOrLabelOrResolver)) {
    const definition = definitionOrLabelOrResolver;

    return (
      target: object,
      propertyKey: string | symbol,
      descriptor: PropertyDescriptor,
    ) => {
      if (typeof propertyKey !== 'string') {
        throw new Error('@SubMenu supports string method names only.');
      }

      if (typeof descriptor.value !== 'function') {
        throw new Error('@SubMenu({...}) can only be used on methods.');
      }

      const ctor = getTargetCtor(target);
      const submenus = getStoredSubmenus(ctor);

      submenus.push({
        member: propertyKey,
        source: 'method',
        label: definition.label,
        id: definition.id?.trim() || undefined,
        order: definition.order,
        before: definition.before?.trim() || undefined,
        after: definition.after?.trim() || undefined,
      });

      Reflect.defineMetadata(menuNodeSubmenusKey, submenus, ctor);
    };
  }

  return (target: object, propertyKey: string | symbol) => {
    if (typeof propertyKey !== 'string') {
      throw new Error('@SubMenu supports string property names only.');
    }

    const ctor = getTargetCtor(target);
    const submenus = getStoredSubmenus(ctor);

    let label: string | undefined;
    let targetResolver: (() => Function) | undefined;

    if (typeof definitionOrLabelOrResolver === 'string') {
      label = definitionOrLabelOrResolver.trim();
      targetResolver = resolver;
    } else if (typeof definitionOrLabelOrResolver === 'function') {
      targetResolver = definitionOrLabelOrResolver;
    }

    submenus.push({
      member: propertyKey,
      source: 'property',
      label,
      targetResolver,
    });

    Reflect.defineMetadata(menuNodeSubmenusKey, submenus, ctor);
  };
}

/**
 * Inserts a separator right above the decorated @MenuItem or @SubMenu.
 *
 * The decorator only records the member name; the actual separator entry is
 * generated when the menu items are collected (see `collectDslMenuItems`).
 * Because of that, the stacking order with @MenuItem / @SubMenu does not
 * matter.
 *
 * @example
 * ```ts
 * @MenuSeparator()
 * @MenuItem({ id: 'file.quit', label: 'Quit', role: 'quit' })
 * quit() {}
 * ```
 */
export function MenuSeparator(): MethodDecorator & PropertyDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    _descriptor?: PropertyDescriptor,
  ) => {
    if (typeof propertyKey !== 'string') {
      throw new Error('@MenuSeparator supports string member names only.');
    }

    const ctor = getTargetCtor(target);
    const members = getStoredSeparators(ctor);
    members.add(propertyKey);

    Reflect.defineMetadata(menuSeparatorKey, [...members], ctor);
  };
}

/** Whether the given member must be preceded by a separator. */
export function hasMenuSeparatorBefore(
  target: Function,
  member: string,
): boolean {
  return getStoredSeparators(target).has(member);
}

/** Whether at least one member of the class is flagged with @MenuSeparator. */
export function hasMenuSeparators(target: Function): boolean {
  return getStoredSeparators(target).size > 0;
}

export function getMenuDslSubmenus(target: Function): DslSubmenuMetadata[] {
  return getStoredSubmenus(target);
}
