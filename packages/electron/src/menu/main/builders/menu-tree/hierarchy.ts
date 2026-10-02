import { createMenuItem } from '../create-menu-item';
import type { GroupNode, IndexedMenuItemMetadataEntry } from './types';

function normalizeSegment(segment: string): string {
  return segment
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
}

function groupIdFromPath(pathKey: string): string {
  const normalized = pathKey
    .split('/')
    .map(normalizeSegment)
    .filter((segment) => segment.length > 0)
    .join('.');

  return normalized.length > 0 ? `menu.${normalized}` : 'menu.root';
}

function createGroupNode(pathKey: string, label: string): GroupNode {
  const item = createMenuItem({
    id: groupIdFromPath(pathKey),
    label,
  });

  return {
    pathKey,
    item,
    childGroups: new Map<string, GroupNode>(),
    leafEntries: [],
  };
}

/**
 * Builds group hierarchy from _submenuPath metadata.
 * _submenuPath is generated automatically from @MenuItem class labels and @SubMenu hierarchy.
 */
export function buildGroupHierarchy(
  entries: IndexedMenuItemMetadataEntry[],
): GroupNode {
  const root = createGroupNode('root', 'root');

  for (const entry of entries) {
    const submenuPath = entry._submenuPath || 'root';
    const segments = submenuPath
      .split('/')
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0);

    let current = root;
    let currentPath = '';

    for (const segment of segments) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;

      let next = current.childGroups.get(segment);
      if (!next) {
        next = createGroupNode(currentPath, segment);
        current.childGroups.set(segment, next);
      }

      current = next;
    }

    current.leafEntries.push(entry);
  }

  return root;
}
