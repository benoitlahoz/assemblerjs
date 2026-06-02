import { getMenuItems } from '@/main/menu/decorators/menu-item.decorator';
import type { MenuItemMetadataEntry } from '@/universal/metadata';
import type { ElectronMenuItem } from './electron-menu-item';
import { createMenuItem } from './create-menu-item';

interface IndexedMenuItemMetadataEntry extends MenuItemMetadataEntry {
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

function buildGroupHierarchy(
  entries: IndexedMenuItemMetadataEntry[],
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
        next = createGroupNode(currentPath, segment);
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
): ElectronMenuItem {
  return createMenuItem({
    id: entry.id,
    label: entry.label,
    type: entry.type,
    checked: entry.checked,
    enabled: entry.enabled,
    role: entry.role,
    accelerator: entry.accelerator,
  });
}

function materializeGroup(
  group: GroupNode,
  itemsById: Map<string, ElectronMenuItem>,
): ElectronMenuItem {
  const childGroups = [...group.childGroups.values()]
    .sort((a, b) => a.pathKey.localeCompare(b.pathKey))
    .map((child) => materializeGroup(child, itemsById));

  const sortedLeaves = sortEntriesWithAnchors([...group.leafEntries]).map(
    (entry) => {
      const item = buildMenuItemFromEntry(entry);
      itemsById.set(entry.id, item);
      return item;
    },
  );

  const submenu = [...childGroups, ...sortedLeaves];
  if (submenu.length > 0) {
    group.item.submenu = submenu;
  }

  return group.item;
}

export function buildMenuTreeFromMetadata(target: Function): BuiltMenuTree {
  const metadata = getMenuItems(target).map((entry, index) => ({
    ...entry,
    declarationIndex: index,
  }));

  if (metadata.length === 0) {
    return {
      roots: [],
      itemsById: new Map<string, ElectronMenuItem>(),
    };
  }

  const root = buildGroupHierarchy(metadata);
  const itemsById = new Map<string, ElectronMenuItem>();

  const roots = [...root.childGroups.values()]
    .sort((a, b) => a.pathKey.localeCompare(b.pathKey))
    .map((group) => materializeGroup(group, itemsById));

  return {
    roots,
    itemsById,
  };
}
