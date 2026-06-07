import { sortMenuItemsByOrdering } from '../menu-tree';
import type { ElectronMenuItem } from './types';

export function mergeSubmenu(
  existing: ElectronMenuItem,
  incoming: ElectronMenuItem,
): void {
  const existingSubmenu = existing.submenu || [];
  const incomingSubmenu = incoming.submenu || [];

  for (const incomingItem of incomingSubmenu) {
    const duplicate = existingSubmenu.find(
      (item) => item.id === incomingItem.id,
    );

    if (!duplicate) {
      existingSubmenu.push(incomingItem);
      continue;
    }

    const duplicateHasSubmenu = (duplicate.submenu?.length || 0) > 0;
    const incomingHasSubmenu = (incomingItem.submenu?.length || 0) > 0;

    if (duplicateHasSubmenu && incomingHasSubmenu) {
      mergeSubmenu(duplicate, incomingItem);
      continue;
    }

    throw new Error(
      `Duplicate menu item id '${incomingItem.id}' detected while composing menu trees.`,
    );
  }

  existing.submenu = sortMenuItemsByOrdering(existingSubmenu);
}
