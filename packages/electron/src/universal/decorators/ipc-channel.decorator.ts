export const IpcChannel = () => {
  return (target: any, propertyKey: string, parameterIndex: number) => {
    const existingChannelParameters: number[] =
      Reflect.getMetadata('ipc-channel:parameters', target, propertyKey) || [];
    existingChannelParameters.push(parameterIndex);
    Reflect.defineMetadata(
      'ipc-channel:parameters',
      existingChannelParameters,
      target,
      propertyKey,
    );
  };
};
