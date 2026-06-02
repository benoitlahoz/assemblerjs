import {
  AbstractMutableNamedRegistry,
  NamedRegistryEntry,
} from './named-registry.abstract';

export class MapNamedRegistry<
  TName extends string = string,
  TValue = unknown,
> extends AbstractMutableNamedRegistry<TName, TValue> {
  protected readonly entries = new Map<TName, TValue>();

  public register(name: TName, value: TValue): void {
    this.entries.set(name, value);
  }

  public unregister(name: TName): boolean {
    return this.entries.delete(name);
  }

  public clear(): void {
    this.entries.clear();
  }

  public has(name: TName): boolean {
    return this.entries.has(name);
  }

  public get(name: TName): TValue | undefined {
    return this.entries.get(name);
  }

  public list(): ReadonlyArray<NamedRegistryEntry<TName, TValue>> {
    return [...this.entries.entries()].map(([name, value]) => ({
      name,
      value,
    }));
  }
}
