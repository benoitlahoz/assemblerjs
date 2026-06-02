import {
  getIpcChannelParameterIndices,
  setIpcChannelParameterIndices,
} from '@/universal/metadata';

export const IpcChannel = () => {
  return (
    target: object,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) => {
    const existingChannelParameters = getIpcChannelParameterIndices(
      target,
      propertyKey,
    );

    setIpcChannelParameterIndices(target, propertyKey, [
      ...existingChannelParameters,
      parameterIndex,
    ]);
  };
};
