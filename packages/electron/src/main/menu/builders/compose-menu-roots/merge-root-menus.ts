import { sortMenuItemsByOrdering } from '../build-menu-tree-from-metadata';
import type { ElectronMenuItem } from './types';
import { mergeSubmenu } from './merge-submenu';

export function mergeRootMenus(roots: ElectronMenuItem[]): ElectronMenuItem[] {
  const merged: ElectronMenuItem[] = [];
  const byId = new Map<string, ElectronMenuItem>();

  for (const root of roots) {
    const duplicate = byId.get(root.id);
    if (!duplicate) {
      byId.set(root.id, root);
      merged.push(root);
      continue;
    }

    mergeSubmenu(duplicate, root);
  }

  return sortMenuItemsByOrdering(merged);
}
