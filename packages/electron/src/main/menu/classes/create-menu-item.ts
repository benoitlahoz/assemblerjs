import { ElectronMenuItem } from './electron-menu-item';

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
