import { ElectronMetadata } from '@/universal/metadata';

export function WindowOn(channel: string): MethodDecorator {
  return function (
    target: object,
    propertyKey: string,
    _descriptor: PropertyDescriptor,
  ) {
    ElectronMetadata.window.addMainSubscription(target, propertyKey, channel);
  } as MethodDecorator;
}
