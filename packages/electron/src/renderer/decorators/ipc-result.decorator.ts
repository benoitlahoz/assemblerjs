export const IpcResult = () => {
  return (target: any, propertyKey: string, parameterIndex: number) => {
    const existingBodyParameters: number[] =
      Reflect.getMetadata('ipc-result:parameters', target, propertyKey) || [];
    existingBodyParameters.push(parameterIndex);
    Reflect.defineMetadata('ipc-result:parameters', existingBodyParameters, target, propertyKey);
  };
};
