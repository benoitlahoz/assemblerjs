import { addMenuRendererSubscriptionMetadata } from '@/universal/metadata';

export const MenuOn = (event: string): MethodDecorator => {
  return function (
    target: object,
    propertyKey: string,
    _descriptor: PropertyDescriptor,
  ) {
    addMenuRendererSubscriptionMetadata(target, propertyKey, event, 'on');
  } as MethodDecorator;
};
