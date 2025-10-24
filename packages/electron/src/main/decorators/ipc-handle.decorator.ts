import { IpcSubMethods } from '@/universal/decorators';

export const IpcHandle = (
  channel: string,
  withEvent = false
): MethodDecorator => {
  return function (
    target: any,
    propertyKey: string,
    _descriptor: PropertyDescriptor
  ) {
    target[IpcSubMethods] = target[IpcSubMethods] || new Map();
    target[IpcSubMethods].set(propertyKey, {
      channel,
      type: 'handle',
      withEvent,
    });
  } as MethodDecorator;
};
