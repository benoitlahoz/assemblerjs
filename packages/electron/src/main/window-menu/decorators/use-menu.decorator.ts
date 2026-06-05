import { ElectronMetadata } from '@/universal/metadata';
import {
  normalizeUseMenuDefinition,
  type MenuReference,
  type NormalizedUseMenuDefinition,
  type UseMenuDefinition,
  type UseMenuSlot,
} from '../contracts';

/**
 * Declares which menu tree a window uses.
 * This decorator stores metadata only; runtime binding is handled by services.
 */
export function UseMenu(
  definition: MenuReference | UseMenuDefinition | UseMenuSlot[],
): ClassDecorator {
  return (target: Function) => {
    ElectronMetadata.window.setUseMenuDefinition(
      target,
      normalizeUseMenuDefinition(definition),
    );
  };
}

export function getUseMenuDefinition(
  target: Function,
): NormalizedUseMenuDefinition | undefined {
  return ElectronMetadata.window.getUseMenuDefinition(target) as
    | NormalizedUseMenuDefinition
    | undefined;
}
