import type { Identifier } from 'assemblerjs';
import type { MutableNamedRegistry } from '@assemblerjs/common';
import type { ElectronWindow } from '@/main/window/classes';

export interface WindowRegistryEntry {
  token: Identifier<any>;
  multiple?: boolean;
}

export abstract class AbstractWindowRegistryService implements MutableNamedRegistry<
  string,
  WindowRegistryEntry
> {
  public abstract register(name: string, value: WindowRegistryEntry): void;

  public abstract unregister(name: string): boolean;

  public abstract clear(): void;

  public abstract has(name: string): boolean;

  public abstract get(name: string): WindowRegistryEntry | undefined;

  public abstract list(): ReadonlyArray<{
    name: string;
    value: WindowRegistryEntry;
  }>;

  public abstract getOpen(name: string): ElectronWindow | undefined;

  public abstract listOpen(): ElectronWindow[];
}
