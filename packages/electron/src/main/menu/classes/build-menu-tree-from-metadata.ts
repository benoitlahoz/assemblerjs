import { getMenuItems } from '@/main/menu/decorators/menu-item.decorator';
import { getForwardToRendererMethods } from '@/main/menu/decorators/forward-click-to-renderer.decorator';
import { getHandleInMainMethods } from '@/main/menu/decorators/handle-in-main.decorator';
import type {
  MenuItemLabelResolverContext,
  MenuItemMetadataEntry,
} from '@/universal/metadata';
import type { ElectronMenuItem } from './electron-menu-item';
import { createMenuItem } from './create-menu-item';

interface IndexedMenuItemMetadataEntry extends MenuItemMetadataEntry {
  path: string;
  declarationIndex: number;
}

interface GroupNode {
  pathKey: string;
  item: ElectronMenuItem;
  childGroups: Map<string, GroupNode>;
  leafEntries: IndexedMenuItemMetadataEntry[];
}

export interface BuiltMenuTree {
  roots: ElectronMenuItem[];
  itemsById: Map<string, ElectronMenuItem>;
}

export interface BuildMenuTreeOptions {
  translate?: (key: string) => string;
  pathFallback?: string;
}

interface BuildBehaviorContext {
  handleInMainMethods: Set<string>;
  forwardToRendererMethods: Set<string>;
  instance?: Record<string, unknown>;
  target: Function;
  translate: (key: string) => string;
}

interface OrderingKey {
  order: number;
  declarationIndex: number;
}

export interface MenuItemOrderingMetadata extends OrderingKey {
  stableId: string;
}

const MENU_ITEM_ORDERING_METADATA_KEY = Symbol(
  'assemblerjs.electron.menu.item-ordering',
);

function normalizePath(path: string): string {
  const normalized = path
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .join('/');

  if (normalized.length === 0) {
    throw new Error('Menu item path must be a valid non-empty string.');
  }

  return normalized;
}

function resolveEntryPath(
  entry: MenuItemMetadataEntry,
  pathFallback?: string,
): string {
  if (typeof entry.path === 'string') {
    return normalizePath(entry.path);
  }

  if (typeof pathFallback === 'string') {
    return normalizePath(pathFallback);
  }

  throw new Error(
    `@MenuItem('${entry.id}') requires a 'path' or a @MenuFragment({ path }) fallback.`,
  );
}

function resolveTranslate(
  _instance: Record<string, unknown> | undefined,
  options?: BuildMenuTreeOptions,
): (key: string) => string {
  if (typeof options?.translate === 'function') {
    return options.translate;
  }

  return (key: string) => key;
}

function resolveLabel(
  entry: IndexedMenuItemMetadataEntry,
  behavior: BuildBehaviorContext,
): string | undefined {
  if (typeof entry.label === 'string') {
    return entry.label;
  }

  if (typeof entry.label === 'function') {
    const context: MenuItemLabelResolverContext = {
      itemId: entry.id,
      path: entry.path,
      method: entry.method,
      source: behavior.instance,
      target: behavior.target,
      translate: behavior.translate,
    };

    return entry.label.call(behavior.instance, context);
  }

  return undefined;
}

function normalizeSegment(segment: string): string {
  return segment
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
}

function groupIdFromPath(pathKey: string): string {
  const normalized = pathKey
    .split('/')
    .map(normalizeSegment)
    .filter((segment) => segment.length > 0)
    .join('.');

  return normalized.length > 0 ? `menu.${normalized}` : 'menu.root';
}

function compareEntries(
  a: IndexedMenuItemMetadataEntry,
  b: IndexedMenuItemMetadataEntry,
): number {
  const orderA =
    typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
  const orderB =
    typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;

  if (orderA !== orderB) {
    return orderA - orderB;
  }

  return a.declarationIndex - b.declarationIndex;
}

function entryToOrderingKey(entry: IndexedMenuItemMetadataEntry): OrderingKey {
  return {
    order:
      typeof entry.order === 'number' ? entry.order : Number.MAX_SAFE_INTEGER,
    declarationIndex: entry.declarationIndex,
  };
}

function compareOrderingKeys(a: OrderingKey, b: OrderingKey): number {
  if (a.order !== b.order) {
    return a.order - b.order;
  }

  return a.declarationIndex - b.declarationIndex;
}

function compareMenuItemOrdering(
  a: MenuItemOrderingMetadata,
  b: MenuItemOrderingMetadata,
): number {
  const byOrder = compareOrderingKeys(a, b);
  if (byOrder !== 0) {
    return byOrder;
  }

  return a.stableId.localeCompare(b.stableId);
}

function toFallbackOrdering(item: ElectronMenuItem): MenuItemOrderingMetadata {
  return {
    order: Number.MAX_SAFE_INTEGER,
    declarationIndex: Number.MAX_SAFE_INTEGER,
    stableId: item.id,
  };
}

function setMenuItemOrdering(
  item: ElectronMenuItem,
  metadata: MenuItemOrderingMetadata,
): void {
  (item as any)[MENU_ITEM_ORDERING_METADATA_KEY] = metadata;
}

export function getMenuItemOrdering(
  item: ElectronMenuItem,
): MenuItemOrderingMetadata | undefined {
  return (item as any)[MENU_ITEM_ORDERING_METADATA_KEY] as
    | MenuItemOrderingMetadata
    | undefined;
}

export function sortMenuItemsByOrdering(
  items: ElectronMenuItem[],
): ElectronMenuItem[] {
  for (const item of items) {
    const submenu = item.submenu || [];
    if (submenu.length > 0) {
      item.submenu = sortMenuItemsByOrdering(submenu);
    }
  }

  return [...items].sort((a, b) => {
    const aOrdering = getMenuItemOrdering(a) || toFallbackOrdering(a);
    const bOrdering = getMenuItemOrdering(b) || toFallbackOrdering(b);

    return compareMenuItemOrdering(aOrdering, bOrdering);
  });
}

function resolveGroupOrderingKey(group: GroupNode): OrderingKey {
  let best: OrderingKey | undefined;

  for (const entry of group.leafEntries) {
    const candidate = entryToOrderingKey(entry);
    if (!best || compareOrderingKeys(candidate, best) < 0) {
      best = candidate;
    }
  }

  for (const child of group.childGroups.values()) {
    const candidate = resolveGroupOrderingKey(child);
    if (!best || compareOrderingKeys(candidate, best) < 0) {
      best = candidate;
    }
  }

  if (best) {
    return best;
  }

  return {
    order: Number.MAX_SAFE_INTEGER,
    declarationIndex: Number.MAX_SAFE_INTEGER,
  };
}

function sortEntriesWithAnchors(
  entries: IndexedMenuItemMetadataEntry[],
): IndexedMenuItemMetadataEntry[] {
  if (entries.length <= 1) {
    return entries;
  }

  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const adjacency = new Map<string, Set<string>>();
  const indegree = new Map<string, number>();

  for (const entry of entries) {
    adjacency.set(entry.id, new Set());
    indegree.set(entry.id, 0);
  }

  const addEdge = (from: string, to: string): void => {
    const neighbors = adjacency.get(from);
    if (!neighbors || neighbors.has(to)) {
      return;
    }

    neighbors.add(to);
    indegree.set(to, (indegree.get(to) || 0) + 1);
  };

  for (const entry of entries) {
    if (entry.before && byId.has(entry.before)) {
      addEdge(entry.id, entry.before);
    }

    if (entry.after && byId.has(entry.after)) {
      addEdge(entry.after, entry.id);
    }
  }

  const queue = entries
    .filter((entry) => (indegree.get(entry.id) || 0) === 0)
    .sort(compareEntries);

  const result: IndexedMenuItemMetadataEntry[] = [];

  while (queue.length > 0) {
    const current = queue.shift() as IndexedMenuItemMetadataEntry;
    result.push(current);

    const neighbors = adjacency.get(current.id);
    if (!neighbors) {
      continue;
    }

    for (const neighborId of neighbors) {
      const nextIndegree = (indegree.get(neighborId) || 0) - 1;
      indegree.set(neighborId, nextIndegree);

      if (nextIndegree === 0) {
        const neighbor = byId.get(neighborId);
        if (neighbor) {
          queue.push(neighbor);
          queue.sort(compareEntries);
        }
      }
    }
  }

  if (result.length !== entries.length) {
    throw new Error('Detected cycle while sorting @MenuItem entries.');
  }

  return result;
}

function createGroupNode(pathKey: string, label: string): GroupNode {
  const item = createMenuItem({
    id: groupIdFromPath(pathKey),
    label,
  });

  return {
    pathKey,
    item,
    childGroups: new Map<string, GroupNode>(),
    leafEntries: [],
  };
}

function resolveGroupLabel(
  segment: string,
  translate: (key: string) => string,
): string {
  const key = `menu.group.${normalizeSegment(segment)}`;
  const translated = translate(key);

  if (translated === key) {
    return segment;
  }

  return translated;
}

function buildGroupHierarchy(
  entries: IndexedMenuItemMetadataEntry[],
  translate: (key: string) => string,
): GroupNode {
  const root = createGroupNode('root', 'root');

  for (const entry of entries) {
    const segments = entry.path
      .split('/')
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0);

    let current = root;
    let currentPath = '';

    for (const segment of segments) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;

      let next = current.childGroups.get(segment);
      if (!next) {
        next = createGroupNode(
          currentPath,
          resolveGroupLabel(segment, translate),
        );
        current.childGroups.set(segment, next);
      }

      current = next;
    }

    current.leafEntries.push(entry);
  }

  return root;
}

function buildMenuItemFromEntry(
  entry: IndexedMenuItemMetadataEntry,
  behavior: BuildBehaviorContext,
): ElectronMenuItem {
  const item = createMenuItem({
    id: entry.id,
    label: resolveLabel(entry, behavior),
    type: entry.type,
    checked: entry.checked,
    enabled: entry.enabled,
    role: entry.role,
    accelerator: entry.accelerator,
  });

  if (behavior.handleInMainMethods.has(entry.method)) {
    item.handleInMain((itemId, windowName) => {
      const method = behavior.instance?.[entry.method];
      if (typeof method === 'function') {
        method.call(behavior.instance, itemId, windowName);
      }
    });
  }

  if (behavior.forwardToRendererMethods.has(entry.method)) {
    item.forwardClickToRenderer();
  }

  return item;
}

function materializeGroup(
  group: GroupNode,
  itemsById: Map<string, ElectronMenuItem>,
  behavior: BuildBehaviorContext,
): ElectronMenuItem {
  const childGroups = [...group.childGroups.values()].map((child) => ({
    item: materializeGroup(child, itemsById, behavior),
    orderingKey: resolveGroupOrderingKey(child),
    stableId: child.pathKey,
  }));

  const sortedLeaves = sortEntriesWithAnchors([...group.leafEntries]).map(
    (entry) => {
      const item = buildMenuItemFromEntry(entry, behavior);
      setMenuItemOrdering(item, {
        ...entryToOrderingKey(entry),
        stableId: entry.id,
      });
      itemsById.set(entry.id, item);

      return {
        item,
        orderingKey: entryToOrderingKey(entry),
        stableId: entry.id,
      };
    },
  );

  const submenu = [...childGroups, ...sortedLeaves]
    .sort((a, b) => {
      const byOrder = compareOrderingKeys(a.orderingKey, b.orderingKey);
      if (byOrder !== 0) {
        return byOrder;
      }

      return a.stableId.localeCompare(b.stableId);
    })
    .map((node) => node.item);

  if (submenu.length > 0) {
    group.item.submenu = submenu;
  }

  setMenuItemOrdering(group.item, {
    ...resolveGroupOrderingKey(group),
    stableId: group.pathKey,
  });

  return group.item;
}

export function buildMenuTreeFromMetadata(
  targetOrInstance: Function | object,
  options?: BuildMenuTreeOptions,
): BuiltMenuTree {
  const target =
    typeof targetOrInstance === 'function'
      ? targetOrInstance
      : targetOrInstance.constructor;
  const instance =
    typeof targetOrInstance === 'function'
      ? undefined
      : (targetOrInstance as Record<string, unknown>);

  const metadata = getMenuItems(target).map((entry, index) => ({
    ...entry,
    path: resolveEntryPath(entry, options?.pathFallback),
    declarationIndex: index,
  }));

  const behavior: BuildBehaviorContext = {
    handleInMainMethods: getHandleInMainMethods(target),
    forwardToRendererMethods: getForwardToRendererMethods(target),
    instance,
    target,
    translate: resolveTranslate(instance, options),
  };

  if (metadata.length === 0) {
    return {
      roots: [],
      itemsById: new Map<string, ElectronMenuItem>(),
    };
  }

  const root = buildGroupHierarchy(metadata, behavior.translate);
  const itemsById = new Map<string, ElectronMenuItem>();

  const roots = sortMenuItemsByOrdering(
    [...root.childGroups.values()].map((group) =>
      materializeGroup(group, itemsById, behavior),
    ),
  );

  return {
    roots,
    itemsById,
  };
}
