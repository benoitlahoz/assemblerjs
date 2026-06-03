const menuNodeLabelKey = Symbol('electron:menu:dsl:node-label');
const menuNodeSubmenusKey = Symbol('electron:menu:dsl:submenus');

interface DslSubmenuMetadata {
  property: string;
  label?: string;
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

export function SubMenu(
  labelOrResolver?: string | (() => Function),
  resolver?: () => Function,
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    if (typeof propertyKey !== 'string') {
      throw new Error('@SubMenu supports string property names only.');
    }

    const ctor = getTargetCtor(target);
    const submenus = getStoredSubmenus(ctor);

    let label: string | undefined;
    let targetResolver: (() => Function) | undefined;

    if (typeof labelOrResolver === 'string') {
      label = labelOrResolver.trim();
      targetResolver = resolver;
    } else if (typeof labelOrResolver === 'function') {
      targetResolver = labelOrResolver;
    }

    submenus.push({
      property: propertyKey,
      label,
      targetResolver,
    });

    Reflect.defineMetadata(menuNodeSubmenusKey, submenus, ctor);
  };
}

export function getMenuDslSubmenus(target: Function): DslSubmenuMetadata[] {
  return getStoredSubmenus(target);
}
