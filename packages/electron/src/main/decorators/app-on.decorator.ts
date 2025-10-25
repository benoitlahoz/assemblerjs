import { AppSubMethods } from './app-listener.decorator';

export const AppOn = (channel: string, wait = false): MethodDecorator => {
  return function (
    target: any,
    propertyKey: string,
    _descriptor: PropertyDescriptor
  ) {
    target[AppSubMethods] = target[AppSubMethods] || new Map();
    target[AppSubMethods].set(propertyKey, {
      channel,
      wait,
    });
  } as MethodDecorator;
};
