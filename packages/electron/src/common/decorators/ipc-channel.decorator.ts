import { ElectronMetadata } from '../metadata';

export const IpcChannel = () => {
  return (
    target: object,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) => {
    const existingChannelParameters =
      ElectronMetadata.ipc.getChannelParameterIndices(target, propertyKey);

    ElectronMetadata.ipc.setChannelParameterIndices(target, propertyKey, [
      ...existingChannelParameters,
      parameterIndex,
    ]);
  };
};
