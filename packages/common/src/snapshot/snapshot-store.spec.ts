import { describe, expect, it, vi } from 'vitest';
import { createSnapshotStore } from './snapshot-store';

describe('snapshot-store', () => {
  it('ensure should create once and reuse the same reference', () => {
    const store = createSnapshotStore<string, { value: number }>();

    const first = store.ensure('a', () => ({ value: 1 }));
    const second = store.ensure('a', () => ({ value: 2 }));

    expect(first).toBe(second);
    expect(second.value).toBe(1);
  });

  it('update should mutate snapshot and call touch hook', () => {
    const touch = vi.fn((snapshot: { updatedAt?: number }) => {
      snapshot.updatedAt = 123;
    });

    const store = createSnapshotStore<
      string,
      { count: number; updatedAt?: number }
    >({
      touch,
    });

    const snapshot = store.update(
      'key',
      (value) => {
        value.count += 1;
      },
      () => ({ count: 0 }),
    );

    expect(snapshot.count).toBe(1);
    expect(snapshot.updatedAt).toBe(123);
    expect(touch).toHaveBeenCalledTimes(1);
  });

  it('set/get/has/delete/clear/keys should work as expected', () => {
    const store = createSnapshotStore<string, { id: string }>();

    store.set('a', { id: 'A' });
    store.set('b', { id: 'B' });

    expect(store.has('a')).toBe(true);
    expect(store.get('a')).toEqual({ id: 'A' });
    expect(store.keys()).toEqual(['a', 'b']);

    expect(store.delete('a')).toBe(true);
    expect(store.has('a')).toBe(false);

    store.clear();
    expect(store.keys()).toEqual([]);
  });
});
