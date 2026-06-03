import type { MenuItemMetadataEntry } from './types';

export function normalizePath(path: string): string {
  const normalized = path
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .join('/');

  if (normalized.length === 0) {
    throw new Error('Menu item path must be a valid non-empty string.');
  }

  return normalized;
}

export function resolveEntryPath(
  entry: MenuItemMetadataEntry,
  pathFallback?: string,
): string {
  if (typeof entry.path === 'string') {
    return normalizePath(entry.path);
  }

  if (typeof pathFallback === 'string') {
    return normalizePath(pathFallback);
  }

  // Default to root when no path is provided (slots-based composition)
  return 'root';
}
