import { IpcSubMethods } from './ipc-decorators.types';

export const IpcOnce = (channel: string): MethodDecorator => {
  return function (target: any, propertyKey: string, _descriptor: PropertyDescriptor) {
    target[IpcSubMethods] = target[IpcSubMethods] || new Map();
    target[IpcSubMethods].set(propertyKey, { channel, type: 'once' });
  } as MethodDecorator;
};
