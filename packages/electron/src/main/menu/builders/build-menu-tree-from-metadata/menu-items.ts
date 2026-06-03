import { createMenuItem } from '../create-menu-item';
import { resolveLabel } from './labels';
import type {
  BuildBehaviorContext,
  ElectronMenuItem,
  IndexedMenuItemMetadataEntry,
} from './types';

export function buildMenuItemFromEntry(
  entry: IndexedMenuItemMetadataEntry,
  behavior: BuildBehaviorContext,
): ElectronMenuItem {
  const item = createMenuItem({
    id: entry.id,
    label: resolveLabel(entry, behavior),
    type: entry.type,
    checked: entry.checked,
    enabled: entry.enabled,
    role: entry.role,
    accelerator: entry.accelerator,
  });

  if (entry.handleInMain) {
    item.handleInMain((itemId: string, windowName: string) => {
      const method = behavior.instance?.[entry.method];
      if (typeof method === 'function') {
        method.call(behavior.instance, itemId, windowName);
      }
    });
  }

  if (entry.forwardToRenderer) {
    item.forwardClickToRenderer();
  }

  return item;
}
