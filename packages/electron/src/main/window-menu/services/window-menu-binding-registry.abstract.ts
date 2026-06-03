import type { MutableNamedRegistry } from '@assemblerjs/common';
import type { MenuReference } from '../contracts';

export interface WindowMenuBindingEntry {
  menu: MenuReference;
}

export abstract class AbstractWindowMenuBindingRegistryService
  implements MutableNamedRegistry<string, WindowMenuBindingEntry>
{
  public abstract register(name: string, value: WindowMenuBindingEntry): void;

  public abstract unregister(name: string): boolean;

  public abstract clear(): void;

  public abstract has(name: string): boolean;

  public abstract get(name: string): WindowMenuBindingEntry | undefined;

  public abstract list(): ReadonlyArray<{
    name: string;
    value: WindowMenuBindingEntry;
  }>;

  public abstract attach(windowName: string, menu: MenuReference): Promise<void>;

  public abstract detach(windowName: string): void;

  public abstract refresh(windowName: string): Promise<void>;
}
