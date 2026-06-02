import { addWindowMainSubscriptionMetadata } from '@/universal/metadata';

export function WindowOn(channel: string): MethodDecorator {
  return function (
    target: object,
    propertyKey: string,
    _descriptor: PropertyDescriptor,
  ) {
    addWindowMainSubscriptionMetadata(target, propertyKey, channel);
  } as MethodDecorator;
}
