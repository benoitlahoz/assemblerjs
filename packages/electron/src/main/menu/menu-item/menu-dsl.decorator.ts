const menuNodeLabelKey = Symbol('electron:menu:dsl:node-label');
const menuNodeSubmenusKey = Symbol('electron:menu:dsl:submenus');

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
    getStoredSubmenus(target).length > 0
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

export function getMenuDslSubmenus(target: Function): DslSubmenuMetadata[] {
  return getStoredSubmenus(target);
}
