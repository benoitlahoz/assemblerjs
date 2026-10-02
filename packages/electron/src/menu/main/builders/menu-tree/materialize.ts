import { sortEntriesWithAnchors } from './anchors';
import { buildMenuItemFromEntry } from './menu-items';
import {
  compareOrderingKeys,
  entryToOrderingKey,
  resolveGroupOrderingKey,
  setMenuItemOrdering,
} from './ordering';
import type { BuildBehaviorContext, ElectronMenuItem, GroupNode } from './types';

export function materializeGroup(
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
