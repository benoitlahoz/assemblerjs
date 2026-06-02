import {
  addMenuItemMetadata,
  getMenuItemMetadata,
  type MenuItemLabelValue,
  type MenuItemMetadataEntry,
} from '@/universal/metadata';

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

export function MenuItem(definition: MenuItemDefinition): MethodDecorator {
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
      normalizeMenuItemDefinition(definition),
    );
  };
}

export function getMenuItems(target: Function): MenuItemMetadataEntry[] {
  const entries = getMenuItemMetadata(target);
  return validateMenuItemMetadata(entries);
}
