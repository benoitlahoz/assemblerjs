import {
  WindowRendererSubMethods,
  type WindowRendererSubMethod,
} from './window-decorators.types';

export const WindowOn = (event: string): MethodDecorator => {
  return function (
    target: any,
    propertyKey: string,
    _descriptor: PropertyDescriptor,
  ) {
    target[WindowRendererSubMethods] =
      target[WindowRendererSubMethods] || new Map();

    const map: Map<string, WindowRendererSubMethod> =
      target[WindowRendererSubMethods];

    map.set(propertyKey, { event, type: 'on' });
  } as MethodDecorator;
};
