import { ElectronMenuItem } from '../model/electron-menu-item';
import { getMenuItemOrdering, setMenuItemOrdering } from './menu-tree/ordering';

export interface CreateMenuItemInput {
  id: string;
  label?: string;
  role?: string;
  accelerator?: string;
  type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio' | 'header';
  checked?: boolean;
  enabled?: boolean;
  click?: ElectronMenuItem['click'];
}

export function createMenuItem(input: CreateMenuItemInput): ElectronMenuItem {
  return new ElectronMenuItem(input);
}

/**
 * Creates a deep clone of a MenuItem, optionally overriding submenu.
 */
export function cloneMenuItem(
  source: ElectronMenuItem,
  submenuOverride?: ElectronMenuItem[],
): ElectronMenuItem {
  const clone = source.clone(submenuOverride);

  // Copy ordering metadata to preserve sort order
  const ordering = getMenuItemOrdering(source);
  if (ordering) {
    setMenuItemOrdering(clone, ordering);
  }

  return clone;
}
