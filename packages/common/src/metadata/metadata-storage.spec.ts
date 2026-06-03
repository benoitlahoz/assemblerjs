import { describe, expect, it } from 'vitest';
import {
  createScopedMetadataStore,
  ReflectMetadataStore,
} from './metadata-storage';

describe('ReflectMetadataStore', () => {
  it('setClass/getClass should round-trip class metadata', () => {
    class Base {}

    const store = new ReflectMetadataStore();
    store.setClass('test:class', Base, { name: 'base' });

    expect(store.getClass<{ name: string }>('test:class', Base)).toEqual({
      name: 'base',
    });
  });

  it('addMethodEntry/getMethodEntries should collect across prototype chain', () => {
    class Base {
      public baseMethod(): void {
        return;
      }
    }

    class Child extends Base {
      public childMethod(): void {
        return;
      }
    }

    const store = new ReflectMetadataStore();

    store.addMethodEntry(
      'test:methods',
      Base.prototype,
      'baseMethod',
      'base-1',
    );
    store.addMethodEntry(
      'test:methods',
      Child.prototype,
      'childMethod',
      'child-1',
    );

    expect(store.getMethodEntries<string>('test:methods', Child)).toEqual([
      'child-1',
      'base-1',
    ]);

    expect(
      store.getMethodEntries<string>('test:methods', Child, 'baseMethod'),
    ).toEqual(['base-1']);
  });

  it('setParamIndices/getParamIndices should normalize and return a copy', () => {
    class Sample {
      public run(_a?: unknown, _b?: unknown, _c?: unknown): void {
        return;
      }
    }

    const store = new ReflectMetadataStore();
    store.setParamIndices('test:params', Sample.prototype, 'run', [2, 0, 2]);

    const indices = store.getParamIndices(
      'test:params',
      Sample.prototype,
      'run',
    );
    expect(indices).toEqual([0, 2]);

    indices.push(99);

    expect(
      store.getParamIndices('test:params', Sample.prototype, 'run'),
    ).toEqual([0, 2]);
  });

  it('getPrototypeChain should return instance and parent prototypes only', () => {
    class Base {}
    class Child extends Base {}

    const store = new ReflectMetadataStore();
    const chain = store.getPrototypeChain(Child.prototype);

    expect(chain[0]).toBe(Child.prototype);
    expect(chain[1]).toBe(Base.prototype);
  });

  it('createScopedMetadataStore should use assemblerjs key convention', () => {
    class Sample {
      public run(_x?: unknown): void {
        return;
      }
    }

    const scoped = createScopedMetadataStore('electron');
    scoped.setParamIndices(
      'ipc.channel.parameters',
      Sample.prototype,
      'run',
      [0],
    );

    expect(
      scoped.getParamIndices('ipc.channel.parameters', Sample.prototype, 'run'),
    ).toEqual([0]);
    expect(scoped.getKey('ipc.channel.parameters')).toBe(
      'assemblerjs:electron:ipc.channel.parameters',
    );
  });
});
