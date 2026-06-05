import { ElectronMetadata } from '../metadata';

export const IpcResult = () => {
  return (
    target: object,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) => {
    const existingBodyParameters =
      ElectronMetadata.ipc.getResultParameterIndices(target, propertyKey);

    ElectronMetadata.ipc.setResultParameterIndices(target, propertyKey, [
      ...existingBodyParameters,
      parameterIndex,
    ]);
  };
};
