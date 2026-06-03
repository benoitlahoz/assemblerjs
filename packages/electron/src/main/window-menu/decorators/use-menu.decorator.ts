import {
  getWindowUseMenuDefinitionMetadata,
  setWindowUseMenuDefinitionMetadata,
} from '@/universal/metadata';
import {
  normalizeUseMenuDefinition,
  type MenuReference,
  type NormalizedUseMenuDefinition,
  type UseMenuDefinition,
} from '../contracts';

/**
 * Declares which menu tree a window uses.
 * This decorator stores metadata only; runtime binding is handled by services.
 */
export function UseMenu(
  definition: MenuReference | UseMenuDefinition,
): ClassDecorator {
  return (target: Function) => {
    setWindowUseMenuDefinitionMetadata(
      target,
      normalizeUseMenuDefinition(definition),
    );
  };
}

export function getUseMenuDefinition(
  target: Function,
): NormalizedUseMenuDefinition | undefined {
  return getWindowUseMenuDefinitionMetadata(target) as
    | NormalizedUseMenuDefinition
    | undefined;
}
