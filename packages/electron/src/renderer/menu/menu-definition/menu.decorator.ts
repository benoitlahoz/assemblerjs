import {
  MenuRendererDefinitionMetadataKey,
  normalizeMenuRendererDefinition,
  type MenuRendererDefinition,
  getMenuRendererDefinition,
  resolveMenuRendererDefinition,
} from './menu-definition';
import { ElectronMetadata } from '@/universal/metadata';
import { MenuListener } from '../menu-listener/menu-listener.decorator';

export function Menu(
  definition: string | Partial<MenuRendererDefinition>,
): ClassDecorator {
  const listenerDecorator = MenuListener();

  return (target: Function) => {
    ElectronMetadata.menu.setRendererDefinition(
      target,
      normalizeMenuRendererDefinition(definition),
    );

    const decorated = listenerDecorator(target as any) as Function | void;
    return (decorated || target) as any;
  };
}

export {
  MenuRendererDefinitionMetadataKey,
  getMenuRendererDefinition,
  resolveMenuRendererDefinition,
};
export type { MenuRendererDefinition };
