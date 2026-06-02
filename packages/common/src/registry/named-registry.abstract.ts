export interface NamedRegistryEntry<
  TName extends string = string,
  TValue = unknown,
> {
  name: TName;
  value: TValue;
}

export abstract class AbstractNamedRegistry<
  TName extends string = string,
  TValue = unknown,
> {
  public abstract has(name: TName): boolean;
  public abstract get(name: TName): TValue | undefined;
  public abstract list(): ReadonlyArray<NamedRegistryEntry<TName, TValue>>;
}

export abstract class AbstractMutableNamedRegistry<
  TName extends string = string,
  TValue = unknown,
> extends AbstractNamedRegistry<TName, TValue> {
  public abstract register(name: TName, value: TValue): void;
  public abstract unregister(name: TName): boolean;
  public abstract clear(): void;
}

export type NamedRegistry<
  TName extends string = string,
  TValue = unknown,
> = AbstractNamedRegistry<TName, TValue>;

export type MutableNamedRegistry<
  TName extends string = string,
  TValue = unknown,
> = AbstractMutableNamedRegistry<TName, TValue>;
