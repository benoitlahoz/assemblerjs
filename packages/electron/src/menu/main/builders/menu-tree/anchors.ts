import { compareEntries } from './ordering';
import type { IndexedMenuItemMetadataEntry } from './types';

export function sortEntriesWithAnchors(
  entries: IndexedMenuItemMetadataEntry[],
): IndexedMenuItemMetadataEntry[] {
  if (entries.length <= 1) {
    return entries;
  }

  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const adjacency = new Map<string, Set<string>>();
  const indegree = new Map<string, number>();

  for (const entry of entries) {
    adjacency.set(entry.id, new Set());
    indegree.set(entry.id, 0);
  }

  const addEdge = (from: string, to: string): void => {
    const neighbors = adjacency.get(from);
    if (!neighbors || neighbors.has(to)) {
      return;
    }

    neighbors.add(to);
    indegree.set(to, (indegree.get(to) || 0) + 1);
  };

  for (const entry of entries) {
    if (entry.before && byId.has(entry.before)) {
      addEdge(entry.id, entry.before);
    }

    if (entry.after && byId.has(entry.after)) {
      addEdge(entry.after, entry.id);
    }
  }

  const queue = entries
    .filter((entry) => (indegree.get(entry.id) || 0) === 0)
    .sort(compareEntries);

  const result: IndexedMenuItemMetadataEntry[] = [];

  while (queue.length > 0) {
    const current = queue.shift() as IndexedMenuItemMetadataEntry;
    result.push(current);

    const neighbors = adjacency.get(current.id);
    if (!neighbors) {
      continue;
    }

    for (const neighborId of neighbors) {
      const nextIndegree = (indegree.get(neighborId) || 0) - 1;
      indegree.set(neighborId, nextIndegree);

      if (nextIndegree === 0) {
        const neighbor = byId.get(neighborId);
        if (neighbor) {
          queue.push(neighbor);
          queue.sort(compareEntries);
        }
      }
    }
  }

  if (result.length !== entries.length) {
    throw new Error('Detected cycle while sorting @MenuItem entries.');
  }

  return result;
}
