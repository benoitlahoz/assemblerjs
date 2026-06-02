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

function resolveGroupLabel(
  segment: string,
  translate: (key: string) => string,
): string {
  const key = `menu.group.${normalizeSegment(segment)}`;
  const translated = translate(key);

  if (translated === key) {
    return segment;
  }

  return translated;
}

export function buildGroupHierarchy(
  entries: IndexedMenuItemMetadataEntry[],
  translate: (key: string) => string,
): GroupNode {
  const root = createGroupNode('root', 'root');

  for (const entry of entries) {
    const segments = entry.path
      .split('/')
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0);

    let current = root;
    let currentPath = '';

    for (const segment of segments) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;

      let next = current.childGroups.get(segment);
      if (!next) {
        next = createGroupNode(
          currentPath,
          resolveGroupLabel(segment, translate),
        );
        current.childGroups.set(segment, next);
      }

      current = next;
    }

    current.leafEntries.push(entry);
  }

  return root;
}
