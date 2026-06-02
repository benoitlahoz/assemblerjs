import {
  createScopedMetadataStore,
  MetadataStorage,
} from '@assemblerjs/common';

export const electronMetadata = createScopedMetadataStore(
  'electron',
  MetadataStorage,
);

export function resolveConstructor(target: Function | object): Function {
  if (typeof target === 'function') {
    return target;
  }

  const ctor = (target as { constructor?: Function }).constructor;
  if (!ctor) {
    throw new Error('Unable to resolve constructor for metadata lookup.');
  }

  return ctor;
}

export function uniqueByMethod<T extends { method: string }>(
  entries: T[],
): T[] {
  const unique = new Map<string, T>();

  for (const entry of entries) {
    if (!unique.has(entry.method)) {
      unique.set(entry.method, entry);
    }
  }

  return [...unique.values()];
}
