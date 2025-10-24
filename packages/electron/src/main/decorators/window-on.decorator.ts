import { WindowSubMethods } from './window-listener.decorator';

export function WindowOn(channel: string): MethodDecorator {
  return function (
    target: any,
    propertyKey: string,
    _descriptor: PropertyDescriptor
  ) {
    target[WindowSubMethods] = target[WindowSubMethods] || new Map();
    target[WindowSubMethods].set(propertyKey, channel);
  } as MethodDecorator;
}
