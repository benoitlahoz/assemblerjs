import { ElectronMetadata } from '@/common/metadata';

export const WindowOn = (event: string): MethodDecorator => {
  return function (
    target: object,
    propertyKey: string,
    _descriptor: PropertyDescriptor,
  ) {
    ElectronMetadata.window.addRendererSubscription(
      target,
      propertyKey,
      event,
      'on',
    );
  } as MethodDecorator;
};
