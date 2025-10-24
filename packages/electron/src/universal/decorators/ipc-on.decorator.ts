import { IpcSubMethods } from './ipc-decorators.types';

export const IpcOn = (channel: string): MethodDecorator => {
  return function (target: any, propertyKey: string, _descriptor: PropertyDescriptor) {
    target[IpcSubMethods] = target[IpcSubMethods] || new Map();
    target[IpcSubMethods].set(propertyKey, { channel, type: 'on' });
  } as MethodDecorator;
};
