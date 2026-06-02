import type {
  ElectronMenuItem,
  GroupNode,
  IndexedMenuItemMetadataEntry,
  MenuItemOrderingMetadata,
  OrderingKey,
} from './types';

const MENU_ITEM_ORDERING_METADATA_KEY = Symbol(
  'assemblerjs.electron.menu.item-ordering',
);

export function compareEntries(
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

export function entryToOrderingKey(
  entry: IndexedMenuItemMetadataEntry,
): OrderingKey {
  return {
    order:
      typeof entry.order === 'number' ? entry.order : Number.MAX_SAFE_INTEGER,
    declarationIndex: entry.declarationIndex,
  };
}

export function compareOrderingKeys(a: OrderingKey, b: OrderingKey): number {
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

export function setMenuItemOrdering(
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

export function resolveGroupOrderingKey(group: GroupNode): OrderingKey {
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
