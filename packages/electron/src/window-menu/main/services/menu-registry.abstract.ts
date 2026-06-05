import type { MutableNamedRegistry } from '@assemblerjs/common';
import type { ElectronMenu } from '@/menu/main';
import type { MenuReference } from '../contracts';

export interface MenuRegistryEntry {
  reference: MenuReference;
}

export abstract class AbstractMenuRegistryService implements MutableNamedRegistry<
  string,
  MenuRegistryEntry
> {
  public abstract register(name: string, value: MenuRegistryEntry): void;

  public abstract unregister(name: string): boolean;

  public abstract clear(): void;

  public abstract has(name: string): boolean;

  public abstract get(name: string): MenuRegistryEntry | undefined;

  public abstract list(): ReadonlyArray<{
    name: string;
    value: MenuRegistryEntry;
  }>;

  public abstract resolveMenu(reference: MenuReference): ElectronMenu;
}
