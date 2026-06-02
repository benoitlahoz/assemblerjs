import {
  getIpcResultParameterIndices,
  setIpcResultParameterIndices,
} from '@/universal/metadata';

export const IpcResult = () => {
  return (
    target: object,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) => {
    const existingBodyParameters = getIpcResultParameterIndices(
      target,
      propertyKey,
    );

    setIpcResultParameterIndices(target, propertyKey, [
      ...existingBodyParameters,
      parameterIndex,
    ]);
  };
};
