import { addWindowRendererSubscriptionMetadata } from '@/universal/metadata';

export const WindowOn = (event: string): MethodDecorator => {
  return function (
    target: object,
    propertyKey: string,
    _descriptor: PropertyDescriptor,
  ) {
    addWindowRendererSubscriptionMetadata(target, propertyKey, event, 'on');
  } as MethodDecorator;
};
