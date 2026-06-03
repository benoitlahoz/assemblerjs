import { electronMetadata } from './electron-metadata.shared';
import { ElectronMetadataNames } from './electron-metadata.names';
import type {
  ElectronMenuDefinitionMetadata,
  ElectronWindowDefinitionMetadata,
  MenuContributionDefinitionMetadata,
  MenuFragmentDefinitionMetadata,
  WindowUseMenuDefinitionMetadata,
} from './electron-metadata.types';

export function setWindowDefinitionMetadata(
  target: Function,
  definition: ElectronWindowDefinitionMetadata,
): void {
  electronMetadata.setClass(
    ElectronMetadataNames.WindowDefinition,
    target,
    definition,
  );
}

export function getWindowDefinitionMetadata(
  target: Function,
): ElectronWindowDefinitionMetadata | undefined {
  return electronMetadata.getClass(
    ElectronMetadataNames.WindowDefinition,
    target,
  );
}

export function setMenuDefinitionMetadata(
  target: Function,
  definition: ElectronMenuDefinitionMetadata,
): void {
  electronMetadata.setClass(
    ElectronMetadataNames.MenuDefinition,
    target,
    definition,
  );
}

export function getMenuDefinitionMetadata(
  target: Function,
): ElectronMenuDefinitionMetadata | undefined {
  return electronMetadata.getClass(
    ElectronMetadataNames.MenuDefinition,
    target,
  );
}

export function setWindowUseMenuDefinitionMetadata(
  target: Function,
  definition: WindowUseMenuDefinitionMetadata,
): void {
  electronMetadata.setClass(
    ElectronMetadataNames.WindowUseMenuDefinition,
    target,
    definition,
  );
}

export function getWindowUseMenuDefinitionMetadata(
  target: Function,
): WindowUseMenuDefinitionMetadata | undefined {
  return electronMetadata.getClass(
    ElectronMetadataNames.WindowUseMenuDefinition,
    target,
  );
}

export function setMenuContributionDefinitionMetadata(
  target: Function,
  definition: MenuContributionDefinitionMetadata,
): void {
  electronMetadata.setClass(
    ElectronMetadataNames.MenuContributionDefinition,
    target,
    definition,
  );
}

export function getMenuContributionDefinitionMetadata(
  target: Function,
): MenuContributionDefinitionMetadata | undefined {
  return electronMetadata.getClass(
    ElectronMetadataNames.MenuContributionDefinition,
    target,
  );
}

export function setMenuFragmentDefinitionMetadata(
  target: Function,
  definition: MenuFragmentDefinitionMetadata,
): void {
  electronMetadata.setClass(
    ElectronMetadataNames.MenuFragmentDefinition,
    target,
    definition,
  );
}

export function getMenuFragmentDefinitionMetadata(
  target: Function,
): MenuFragmentDefinitionMetadata | undefined {
  return electronMetadata.getClass(
    ElectronMetadataNames.MenuFragmentDefinition,
    target,
  );
}

export function setWindowRendererDefinitionMetadata(
  target: Function,
  definition: { name: string },
): void {
  electronMetadata.setClass(
    ElectronMetadataNames.WindowRendererDefinition,
    target,
    definition,
  );
}

export function getWindowRendererDefinitionMetadata(
  target: Function,
): { name: string } | undefined {
  return electronMetadata.getClass(
    ElectronMetadataNames.WindowRendererDefinition,
    target,
  );
}

export function setMenuRendererDefinitionMetadata(
  target: Function,
  definition: ElectronMenuDefinitionMetadata,
): void {
  electronMetadata.setClass(
    ElectronMetadataNames.MenuRendererDefinition,
    target,
    definition,
  );
}

export function getMenuRendererDefinitionMetadata(
  target: Function,
): ElectronMenuDefinitionMetadata | undefined {
  return electronMetadata.getClass(
    ElectronMetadataNames.MenuRendererDefinition,
    target,
  );
}
