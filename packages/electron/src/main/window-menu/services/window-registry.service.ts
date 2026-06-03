import { Assemblage } from 'assemblerjs';
import { MapNamedRegistry } from '@assemblerjs/common';
import { ElectronWindow } from '@/main/window/classes';
import {
  AbstractWindowRegistryService,
  type WindowRegistryEntry,
} from './window-registry.abstract';

@Assemblage()
export class WindowRegistryService
  extends MapNamedRegistry<string, WindowRegistryEntry>
  implements AbstractWindowRegistryService
{
  public getOpen(name: string): ElectronWindow | undefined {
    return ElectronWindow.getByName(name);
  }

  public listOpen(): ElectronWindow[] {
    return ElectronWindow.getAllWindows().filter(
      (window) => !window.isDestroyed(),
    ) as ElectronWindow[];
  }
}
