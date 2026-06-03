import {
  addMenuItemMetadata,
  getMenuItemMetadata,
  type MenuItemLabelValue,
  type MenuItemMetadataEntry,
} from '@/universal/metadata';
import {
  getMenuDslSubmenus,
  getMenuNodeLabel,
  hasMenuDslMetadata,
  setMenuNodeLabel,
  SubMenu,
} from './menu-dsl.decorator';

export interface MenuItemDefinition {
  id: string;
  path?: string;
  label?: MenuItemLabelValue;
  type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio';
  checked?: boolean;
  enabled?: boolean;
  role?: string;
  accelerator?: string;
  order?: number;
  before?: string;
  after?: string;
  handleInMain?: boolean;
  forwardToRenderer?: boolean;
}

function assertNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`@MenuItem requires a non-empty '${field}'.`);
  }

  return value.trim();
}

function validatePath(path: string): string {
  const normalized = path
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .join('/');

  if (normalized.length === 0) {
    throw new Error("@MenuItem requires a valid non-empty 'path'.");
  }

  return normalized;
}

export function normalizeMenuItemDefinition(
  definition: MenuItemDefinition,
): Omit<MenuItemMetadataEntry, 'method'> {
  const id = assertNonEmptyString(definition.id, 'id');
  const path =
    typeof definition.path === 'string'
      ? validatePath(assertNonEmptyString(definition.path, 'path'))
      : undefined;

  if (
    typeof definition.before === 'string' &&
    typeof definition.after === 'string' &&
    definition.before.trim().length > 0 &&
    definition.after.trim().length > 0 &&
    definition.before.trim() === definition.after.trim()
  ) {
    throw new Error(
      `@MenuItem('${id}') cannot target the same anchor in 'before' and 'after'.`,
    );
  }

  return {
    id,
    path,
    label: definition.label,
    type: definition.type,
    checked: definition.checked,
    enabled: definition.enabled,
    role: definition.role,
    accelerator: definition.accelerator,
    order: definition.order,
    before: definition.before?.trim() || undefined,
    after: definition.after?.trim() || undefined,
    handleInMain: definition.handleInMain === true,
    forwardToRenderer: definition.forwardToRenderer === true,
  };
}

function assertNoDuplicateIds(entries: MenuItemMetadataEntry[]): void {
  const seen = new Map<string, string>();

  for (const entry of entries) {
    const previousMethod = seen.get(entry.id);
    if (previousMethod) {
      throw new Error(
        `Duplicate @MenuItem id '${entry.id}' detected on methods '${previousMethod}' and '${entry.method}'.`,
      );
    }

    seen.set(entry.id, entry.method);
  }
}

function assertAnchorsExist(entries: MenuItemMetadataEntry[]): void {
  const ids = new Set(entries.map((entry) => entry.id));

  for (const entry of entries) {
    if (entry.before && !ids.has(entry.before)) {
      throw new Error(
        `@MenuItem('${entry.id}') references unknown 'before' anchor '${entry.before}'.`,
      );
    }

    if (entry.after && !ids.has(entry.after)) {
      throw new Error(
        `@MenuItem('${entry.id}') references unknown 'after' anchor '${entry.after}'.`,
      );
    }
  }
}

function assertNoOrderingCycles(entries: MenuItemMetadataEntry[]): void {
  const adjacency = new Map<string, Set<string>>();

  for (const entry of entries) {
    if (!adjacency.has(entry.id)) {
      adjacency.set(entry.id, new Set());
    }
  }

  for (const entry of entries) {
    if (entry.before) {
      // entry must be before anchor: edge entry -> anchor
      adjacency.get(entry.id)?.add(entry.before);
    }

    if (entry.after) {
      // entry must be after anchor: edge anchor -> entry
      adjacency.get(entry.after)?.add(entry.id);
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  const dfs = (node: string): boolean => {
    if (visiting.has(node)) {
      return true;
    }

    if (visited.has(node)) {
      return false;
    }

    visiting.add(node);

    const neighbors = adjacency.get(node);
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (dfs(neighbor)) {
          return true;
        }
      }
    }

    visiting.delete(node);
    visited.add(node);
    return false;
  };

  for (const node of adjacency.keys()) {
    if (dfs(node)) {
      throw new Error('Detected cycle in @MenuItem ordering constraints.');
    }
  }
}

export function validateMenuItemMetadata(
  entries: MenuItemMetadataEntry[],
): MenuItemMetadataEntry[] {
  assertNoDuplicateIds(entries);
  assertAnchorsExist(entries);
  assertNoOrderingCycles(entries);
  return entries;
}

export function MenuItem(definition: MenuItemDefinition): MethodDecorator;
export function MenuItem(groupLabel: string): ClassDecorator;
export function MenuItem(
  definitionOrGroup: MenuItemDefinition | string,
): MethodDecorator | ClassDecorator {
  if (typeof definitionOrGroup === 'string') {
    return (target: Function) => {
      setMenuNodeLabel(target, definitionOrGroup);
    };
  }

  return (
    target: object,
    propertyKey: string | symbol,
    _descriptor: PropertyDescriptor,
  ) => {
    if (typeof propertyKey !== 'string') {
      throw new Error('@MenuItem supports string method names only.');
    }

    addMenuItemMetadata(
      target,
      propertyKey,
      normalizeMenuItemDefinition(definitionOrGroup),
    );
  };
}

function resolveSubmenuTarget(
  target: Function,
  instance: object | undefined,
  submenu: ReturnType<typeof getMenuDslSubmenus>[number],
): { ctor: Function; instance?: object } {
  if (submenu.targetResolver) {
    const resolved = submenu.targetResolver();
    if (typeof resolved === 'function') {
      return {
        ctor: resolved,
      };
    }
  }

  if (instance) {
    const candidate = (instance as Record<string, unknown>)[submenu.member];

    if (submenu.source === 'method') {
      if (typeof candidate === 'function') {
        const resolved = candidate.call(instance);
        if (typeof resolved === 'function') {
          return {
            ctor: resolved,
          };
        }

        if (
          resolved &&
          typeof (resolved as { constructor?: unknown }).constructor ===
            'function'
        ) {
          return {
            ctor: (resolved as { constructor: Function }).constructor,
            instance: resolved as object,
          };
        }
      }
    } else if (typeof candidate === 'function') {
      return {
        ctor: candidate,
      };
    }

    if (
      candidate &&
      typeof (candidate as { constructor?: unknown }).constructor === 'function'
    ) {
      return {
        ctor: (candidate as { constructor: Function }).constructor,
        instance: candidate as object,
      };
    }
  }

  const staticTarget = target as unknown as Record<string, unknown>;
  const staticCandidate = staticTarget[submenu.member];
  if (submenu.source === 'property' && typeof staticCandidate === 'function') {
    return {
      ctor: staticCandidate,
    };
  }

  throw new Error(
    `@SubMenu('${submenu.member}') could not resolve submenu target. Use @SubMenu({...}) on a method returning submenu instance, @SubMenu(label, () => SubMenuClass), or assign a class constructor on '${submenu.member}'.`,
  );
}

function resolveSubmenuLabel(
  submenu: ReturnType<typeof getMenuDslSubmenus>[number],
  target: Function,
  instance: object | undefined,
  fallbackCtor: Function,
): string {
  if (typeof submenu.label === 'string' && submenu.label.trim().length > 0) {
    return submenu.label.trim();
  }

  if (typeof submenu.label === 'function') {
    const label = submenu.label.call(instance ?? target);
    if (typeof label === 'string' && label.trim().length > 0) {
      return label.trim();
    }
  }

  return getMenuNodeLabel(fallbackCtor) ?? submenu.member;
}

const SUBMENU_ORDER_SCALE_FACTOR = 1_000;

function applyBranchOrder(
  entry: MenuItemMetadataEntry,
  branchOrderBase: number,
  branchOrderScale: number,
): number | undefined {
  if (
    branchOrderBase === 0 &&
    branchOrderScale === SUBMENU_ORDER_SCALE_FACTOR
  ) {
    return entry.order;
  }

  const localOrder = typeof entry.order === 'number' ? entry.order : 0;
  const localScale = branchOrderScale / SUBMENU_ORDER_SCALE_FACTOR;

  if (typeof entry.order !== 'number') {
    return branchOrderBase;
  }

  return branchOrderBase + localOrder * localScale;
}

function collectDslMenuItems(
  target: Function,
  instance: object | undefined,
  pathSegments: string[],
  includeOwnLabel: boolean,
  branchOrderBase: number,
  branchOrderScale: number,
  out: MenuItemMetadataEntry[],
  visited: Set<Function>,
): void {
  const ownLabel = includeOwnLabel ? getMenuNodeLabel(target) : undefined;
  const currentSegments = ownLabel ? [...pathSegments, ownLabel] : pathSegments;
  const sourceInstance = instance as Record<string, unknown> | undefined;

  for (const entry of getMenuItemMetadata(target)) {
    out.push({
      ...entry,
      source: sourceInstance,
      order: applyBranchOrder(entry, branchOrderBase, branchOrderScale),
      path:
        entry.path ??
        (currentSegments.length > 0 ? currentSegments.join('/') : undefined),
    } as MenuItemMetadataEntry);
  }

  if (visited.has(target)) {
    return;
  }

  visited.add(target);

  for (const submenu of getMenuDslSubmenus(target)) {
    const resolved = resolveSubmenuTarget(target, instance, submenu);
    const submenuLabel = resolveSubmenuLabel(
      submenu,
      target,
      instance,
      resolved.ctor,
    );
    const childScale = branchOrderScale / SUBMENU_ORDER_SCALE_FACTOR;
    const submenuOrder = typeof submenu.order === 'number' ? submenu.order : 0;
    const childBase = branchOrderBase + submenuOrder * childScale;

    collectDslMenuItems(
      resolved.ctor,
      resolved.instance,
      [...currentSegments, submenuLabel],
      false,
      childBase,
      childScale,
      out,
      visited,
    );
  }
}

export function getMenuItems(
  targetOrInstance: Function | object,
): MenuItemMetadataEntry[] {
  const target =
    typeof targetOrInstance === 'function'
      ? targetOrInstance
      : targetOrInstance.constructor;

  if (!hasMenuDslMetadata(target)) {
    return validateMenuItemMetadata(getMenuItemMetadata(target));
  }

  const dslEntries: MenuItemMetadataEntry[] = [];

  collectDslMenuItems(
    target,
    typeof targetOrInstance === 'function' ? undefined : targetOrInstance,
    [],
    true,
    0,
    SUBMENU_ORDER_SCALE_FACTOR,
    dslEntries,
    new Set<Function>(),
  );

  return validateMenuItemMetadata(dslEntries);
}

export { SubMenu };
