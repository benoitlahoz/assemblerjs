export type SnapshotFactory<TKey, TSnapshot> = (key: TKey) => TSnapshot;

export interface SnapshotStoreOptions<TSnapshot> {
  touch?: (snapshot: TSnapshot) => void;
}

export interface SnapshotStore<TKey, TSnapshot> {
  get(key: TKey): TSnapshot | undefined;
  set(key: TKey, snapshot: TSnapshot): void;
  ensure(key: TKey, factory: SnapshotFactory<TKey, TSnapshot>): TSnapshot;
  update(
    key: TKey,
    updater: (snapshot: TSnapshot) => void,
    factory: SnapshotFactory<TKey, TSnapshot>,
  ): TSnapshot;
  has(key: TKey): boolean;
  delete(key: TKey): boolean;
  clear(): void;
  keys(): ReadonlyArray<TKey>;
}

export function createSnapshotStore<TKey, TSnapshot>(
  options: SnapshotStoreOptions<TSnapshot> = {},
): SnapshotStore<TKey, TSnapshot> {
  const entries = new Map<TKey, TSnapshot>();

  const touch = options.touch;

  const ensure = (
    key: TKey,
    factory: SnapshotFactory<TKey, TSnapshot>,
  ): TSnapshot => {
    const existing = entries.get(key);
    if (existing) {
      return existing;
    }

    const created = factory(key);
    entries.set(key, created);
    return created;
  };

  return {
    get: (key: TKey) => entries.get(key),

    set: (key: TKey, snapshot: TSnapshot) => {
      entries.set(key, snapshot);
    },

    ensure,

    update: (
      key: TKey,
      updater: (snapshot: TSnapshot) => void,
      factory: SnapshotFactory<TKey, TSnapshot>,
    ) => {
      const snapshot = ensure(key, factory);
      updater(snapshot);
      if (touch) {
        touch(snapshot);
      }

      return snapshot;
    },

    has: (key: TKey) => entries.has(key),

    delete: (key: TKey) => entries.delete(key),

    clear: () => {
      entries.clear();
    },

    keys: () => [...entries.keys()],
  };
}
