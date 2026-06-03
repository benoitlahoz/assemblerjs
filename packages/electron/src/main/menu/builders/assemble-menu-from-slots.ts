import { ElectronMenu } from '../model/electron-menu';
import type { ElectronMenuItem } from '../model/electron-menu-item';
import {
  buildMenuTreeFromMetadata,
  getMenuItemOrdering,
  setMenuItemOrdering,
} from './build-menu-tree-from-metadata';
import { mergeRootMenus } from './compose-menu-roots';
import { cloneMenuItem } from './create-menu-item';
import type {
  NormalizedUseMenuSlot,
  UseMenuItemOverride,
} from '../../window-menu/contracts';

class ComposedElectronMenu extends ElectronMenu {
  public onDispose(): void {}
}

function filterItemTree(
  items: ElectronMenuItem[],
  overrides: Record<string, UseMenuItemOverride>,
): ElectronMenuItem[] {
  return items
    .filter((item) => overrides[item.id]?.visible !== false)
    .map((item) => {
      if (item.submenu && item.submenu.length > 0) {
        const filteredSubmenu = filterItemTree(item.submenu, overrides);
        return cloneMenuItem(item, filteredSubmenu);
      }
      return cloneMenuItem(item);
    });
}

/**
 * Assembles a synthetic ElectronMenu from a list of submenu slots.
 *
 * Each slot is a DI token (submenu class) with optional overrides:
 * - `order`: controls the position of this submenu in the menu bar
 * - `label`: overrides the root label (e.g. for i18n)
 * - `items`: per-item overrides (`visible`, `enabled`, `checked`)
 *
 * The `visible: false` override removes items from the tree entirely
 * before the native menu is built. `enabled` and `checked` are applied
 * after assembly via the ElectronMenu API.
 */
export function assembleMenuFromSlots(
  slots: NormalizedUseMenuSlot[],
  resolveInstance: (token: any) => any,
): ElectronMenu {
  const allRoots: ElectronMenuItem[] = [];

  for (let slotIndex = 0; slotIndex < slots.length; slotIndex++) {
    const slot = slots[slotIndex];
    const instance = resolveInstance(slot.token);
    let { roots } = buildMenuTreeFromMetadata(instance);

    // Filter invisible items before assembling
    if (slot.options?.items) {
      roots = filterItemTree(roots, slot.options.items);
    }

    // Override root ordering: slot order (explicit or by position)
    const effectiveOrder = slot.options?.order ?? slotIndex * 10;

    // Clone roots if we need to override label
    if (slot.options?.label) {
      roots = roots.map((root) => {
        const clone = cloneMenuItem(root);
        clone.label = slot.options!.label;
        return clone;
      });
    }

    for (const root of roots) {
      const existing = getMenuItemOrdering(root);
      setMenuItemOrdering(root, {
        order: effectiveOrder,
        declarationIndex: slotIndex * 1000 + (existing?.declarationIndex ?? 0),
        stableId: existing?.stableId ?? root.id,
      });
    }

    allRoots.push(...roots);
  }

  const merged = mergeRootMenus(allRoots);
  const menu = new ComposedElectronMenu();

  for (const root of merged) {
    menu.registerItem(root);
  }

  // Apply enabled / checked state overrides after assembly
  for (const slot of slots) {
    if (!slot.options?.items) {
      continue;
    }

    for (const [itemId, override] of Object.entries(slot.options.items)) {
      if (override.visible === false) {
        continue; // already removed from the tree
      }

      if (override.enabled === false) {
        menu.setItemEnabled(itemId, false);
      }

      if (override.checked !== undefined) {
        const item = menu.itemById(itemId);
        if (item) {
          item.checked = override.checked;
        }
      }
    }
  }

  return menu;
}
