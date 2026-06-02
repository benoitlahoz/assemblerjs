import type { MethodName } from '@assemblerjs/common';
import { electronMetadata } from './electron-metadata.shared';
import { ElectronMetadataNames } from './electron-metadata.names';

export function setIpcChannelParameterIndices(
  target: object,
  method: MethodName,
  indices: number[],
): void {
  electronMetadata.setParamIndices(
    ElectronMetadataNames.IpcChannelParameters,
    target,
    method,
    indices,
  );
}

export function getIpcChannelParameterIndices(
  target: object,
  method: MethodName,
): number[] {
  return electronMetadata.getParamIndices(
    ElectronMetadataNames.IpcChannelParameters,
    target,
    method,
  );
}

export function setIpcResultParameterIndices(
  target: object,
  method: MethodName,
  indices: number[],
): void {
  electronMetadata.setParamIndices(
    ElectronMetadataNames.IpcResultParameters,
    target,
    method,
    indices,
  );
}

export function getIpcResultParameterIndices(
  target: object,
  method: MethodName,
): number[] {
  return electronMetadata.getParamIndices(
    ElectronMetadataNames.IpcResultParameters,
    target,
    method,
  );
}
