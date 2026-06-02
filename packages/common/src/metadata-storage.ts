import 'reflect-metadata';
import { buildMetadataKey } from './metadata-keys';

export type MetadataKey = string | symbol;
export type MethodName = string | symbol;

export interface MetadataStore {
  setClass<T>(key: MetadataKey, target: Function, value: T): void;
  getClass<T>(key: MetadataKey, target: Function): T | undefined;

  addMethodEntry<T>(
    key: MetadataKey,
    target: object,
    method: MethodName,
    value: T,
  ): void;
  getMethodEntries<T>(
    key: MetadataKey,
    target: Function,
    method?: MethodName,
  ): T[];

  setParamIndices(
    key: MetadataKey,
    target: object,
    method: MethodName,
    indices: number[],
  ): void;
  getParamIndices(
    key: MetadataKey,
    target: object,
    method: MethodName,
  ): number[];

  getPrototypeChain(target: Function | object): Array<Function | object>;
}

export interface ScopedMetadataStore {
  readonly scope: string;

  setClass<T>(name: string, target: Function, value: T): void;
  getClass<T>(name: string, target: Function): T | undefined;

  addMethodEntry<T>(
    name: string,
    target: object,
    method: MethodName,
    value: T,
  ): void;
  getMethodEntries<T>(name: string, target: Function, method?: MethodName): T[];

  setParamIndices(
    name: string,
    target: object,
    method: MethodName,
    indices: number[],
  ): void;
  getParamIndices(name: string, target: object, method: MethodName): number[];

  getKey(name: string): string;
}

function getOwnMetadata<T>(key: MetadataKey, target: object): T | undefined {
  const ownGetter = Reflect.getOwnMetadata as
    | ((metadataKey: MetadataKey, metadataTarget: object) => T | undefined)
    | undefined;

  if (typeof ownGetter === 'function') {
    return ownGetter(key, target);
  }

  return Reflect.getMetadata(key, target) as T | undefined;
}

type MethodEntries<T> = Map<MethodName, T[]>;

export class ReflectMetadataStore implements MetadataStore {
  public setClass<T>(key: MetadataKey, target: Function, value: T): void {
    Reflect.defineMetadata(key, value, target);
  }

  public getClass<T>(key: MetadataKey, target: Function): T | undefined {
    return Reflect.getMetadata(key, target) as T | undefined;
  }

  public addMethodEntry<T>(
    key: MetadataKey,
    target: object,
    method: MethodName,
    value: T,
  ): void {
    const entries = this.getOrCreateMethodEntries<T>(key, target);
    const existing = entries.get(method) ?? [];

    entries.set(method, [...existing, value]);
    Reflect.defineMetadata(key, entries, target);
  }

  public getMethodEntries<T>(
    key: MetadataKey,
    target: Function,
    method?: MethodName,
  ): T[] {
    const results: T[] = [];

    for (const proto of this.getPrototypeChain(target.prototype)) {
      if (typeof proto === 'function') {
        continue;
      }

      const entries = getOwnMetadata<MethodEntries<T>>(key, proto);
      if (!entries) {
        continue;
      }

      if (typeof method !== 'undefined') {
        const list = entries.get(method);
        if (list && list.length > 0) {
          results.push(...list);
        }

        continue;
      }

      for (const list of entries.values()) {
        if (list.length > 0) {
          results.push(...list);
        }
      }
    }

    return results;
  }

  public setParamIndices(
    key: MetadataKey,
    target: object,
    method: MethodName,
    indices: number[],
  ): void {
    const normalized = [...new Set(indices)].sort((a, b) => a - b);
    const entries = this.getOrCreateMethodEntries<number>(key, target);

    entries.set(method, normalized);
    Reflect.defineMetadata(key, entries, target);
  }

  public getParamIndices(
    key: MetadataKey,
    target: object,
    method: MethodName,
  ): number[] {
    const entries = Reflect.getMetadata(key, target) as
      | MethodEntries<number>
      | undefined;

    if (!entries) {
      return [];
    }

    return [...(entries.get(method) ?? [])];
  }

  public getPrototypeChain(
    target: Function | object,
  ): Array<Function | object> {
    const chain: Array<Function | object> = [];
    let current: any = target;

    while (
      current &&
      current !== Object.prototype &&
      current !== Function.prototype
    ) {
      chain.push(current);
      current = Object.getPrototypeOf(current);
    }

    return chain;
  }

  private getOrCreateMethodEntries<T>(
    key: MetadataKey,
    target: object,
  ): MethodEntries<T> {
    const existing = getOwnMetadata<MethodEntries<T>>(key, target) as
      | MethodEntries<T>
      | undefined;

    if (existing) {
      return existing;
    }

    const created: MethodEntries<T> = new Map();
    Reflect.defineMetadata(key, created, target);
    return created;
  }
}

export const MetadataStorage = new ReflectMetadataStore();

export function createScopedMetadataStore(
  scope: string,
  store: MetadataStore = MetadataStorage,
): ScopedMetadataStore {
  const getKey = (name: string): string => buildMetadataKey(scope, name);

  return {
    scope,
    setClass<T>(name: string, target: Function, value: T): void {
      store.setClass(getKey(name), target, value);
    },
    getClass<T>(name: string, target: Function): T | undefined {
      return store.getClass<T>(getKey(name), target);
    },
    addMethodEntry<T>(
      name: string,
      target: object,
      method: MethodName,
      value: T,
    ): void {
      store.addMethodEntry(getKey(name), target, method, value);
    },
    getMethodEntries<T>(
      name: string,
      target: Function,
      method?: MethodName,
    ): T[] {
      return store.getMethodEntries<T>(getKey(name), target, method);
    },
    setParamIndices(
      name: string,
      target: object,
      method: MethodName,
      indices: number[],
    ): void {
      store.setParamIndices(getKey(name), target, method, indices);
    },
    getParamIndices(
      name: string,
      target: object,
      method: MethodName,
    ): number[] {
      return store.getParamIndices(getKey(name), target, method);
    },
    getKey,
  };
}
