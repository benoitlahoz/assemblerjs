import { electronMetadata } from './electron-metadata.shared';
import { ElectronMetadataNames } from './electron-metadata.names';
import type {
  ElectronMenuDefinitionMetadata,
  ElectronWindowDefinitionMetadata,
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
