import { ElectronMenuItem } from '../model/electron-menu-item';

export interface CreateMenuItemInput {
  id: string;
  label?: string;
  role?: string;
  accelerator?: string;
  type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio';
  checked?: boolean;
  enabled?: boolean;
}

export function createMenuItem(input: CreateMenuItemInput): ElectronMenuItem {
  const item = new ElectronMenuItem();
  item.id = input.id;
  item.label = input.label;
  if (input.role) {
    item.role = input.role;
  }
  item.accelerator = input.accelerator;
  item.type = input.type;
  item.checked = input.checked;
  if (typeof input.enabled === 'boolean') {
    item.enabled = input.enabled;
  }
  return item;
}

/**
 * Creates a deep clone of a MenuItem, optionally overriding submenu.
 */
export function cloneMenuItem(
  source: ElectronMenuItem,
  submenuOverride?: ElectronMenuItem[],
): ElectronMenuItem {
  const clone = new ElectronMenuItem();
  clone.id = source.id;
  clone.label = source.label;
  if (source.role) {
    clone.role = source.role;
  }
  clone.accelerator = source.accelerator;
  clone.type = source.type;
  clone.checked = source.checked;
  clone.enabled = source.enabled;

  if (submenuOverride !== undefined) {
    clone.submenu = submenuOverride;
  } else if (source.submenu && source.submenu.length > 0) {
    clone.submenu = source.submenu; // Shallow copy submenu reference
  }

  return clone;
}
