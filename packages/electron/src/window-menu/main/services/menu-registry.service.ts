import { Assemblage, getAssemblageContext } from 'assemblerjs';
import type { Identifier } from 'assemblerjs';
import { MapNamedRegistry } from '@assemblerjs/common';
import type { ElectronMenu } from '@/menu/main';
import {
  AbstractMenuRegistryService,
  type MenuRegistryEntry,
} from './menu-registry.abstract';
import type { MenuReference } from '../contracts';

@Assemblage()
export class MenuRegistryService
  extends MapNamedRegistry<string, MenuRegistryEntry>
  implements AbstractMenuRegistryService
{
  public resolveMenu(reference: MenuReference): ElectronMenu {
    const resolvedReference = this.resolveReference(reference);
    const context = getAssemblageContext(this.constructor);

    return context.require(
      resolvedReference as Identifier<any>,
    ) as ElectronMenu;
  }

  private resolveReference(reference: MenuReference): MenuReference {
    if (typeof reference === 'function') {
      return reference;
    }

    const registered = this.entries.get(reference);
    if (!registered) {
      throw new Error(
        `MenuRegistryService cannot resolve unregistered menu name '${reference}'.`,
      );
    }

    return registered.reference;
  }
}
