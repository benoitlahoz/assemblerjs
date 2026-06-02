import type { ElectronMenuItem } from './electron-menu-item';
import { sortMenuItemsByOrdering } from './build-menu-tree-from-metadata';

function mergeSubmenu(
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
      `Duplicate menu item id '${incomingItem.id}' detected while composing menu fragments.`,
    );
  }

  existing.submenu = sortMenuItemsByOrdering(existingSubmenu);
}

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

export function resolveMenuTranslate(
  menuInstance: any,
): ((key: string) => string) | undefined {
  if (typeof menuInstance?.translate === 'function') {
    return (key: string) => menuInstance.translate(key);
  }

  if (typeof menuInstance?.i18n?.translate === 'function') {
    return (key: string) => menuInstance.i18n.translate(key);
  }

  return undefined;
}
