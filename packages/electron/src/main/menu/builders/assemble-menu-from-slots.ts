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

function deepCloneMenuItem(item: ElectronMenuItem): ElectronMenuItem {
  const clonedSubmenu = item.submenu?.length
    ? item.submenu.map((sub) => deepCloneMenuItem(sub))
    : undefined;
  return cloneMenuItem(item, clonedSubmenu);
}

function applyOverridesToItemTree(
  items: ElectronMenuItem[],
  overrides: Record<string, UseMenuItemOverride>,
): ElectronMenuItem[] {
  return items
    .filter((item) => overrides[item.id]?.visible !== false)
    .map((item) => {
      // Deep clone to ensure each window has independent instances
      const cloned = deepCloneMenuItem(item);

      // Apply enabled/checked overrides directly on the clone
      const override = overrides[cloned.id];
      if (override) {
        if (override.enabled !== undefined) {
          cloned.enabled = override.enabled;
        }
        if (override.checked !== undefined) {
          cloned.checked = override.checked;
        }
      }

      // Recursively apply to submenu
      if (cloned.submenu && cloned.submenu.length > 0) {
        cloned.submenu = applyOverridesToItemTree(cloned.submenu, overrides);
      }

      return cloned;
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
 * All overrides are applied during item cloning, before assembly,
 * ensuring each window has independent menu instances.
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

    // Always clone items to ensure each window has independent menu state
    if (slot.options?.items) {
      roots = applyOverridesToItemTree(roots, slot.options.items);
    } else {
      // Clone even without overrides to prevent state leakage between windows
      roots = roots.map((root) => deepCloneMenuItem(root));
    }

    // Override root ordering: slot order (explicit or by position)
    const effectiveOrder = slot.options?.order ?? slotIndex * 10;

    // Clone roots if we need to override label
    if (slot.options?.label) {
      roots = roots.map((root) => {
        const clone = deepCloneMenuItem(root);
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

  return menu;
}
