import { ElectronMetadata } from '@/common/metadata';

export const MenuOn = (event: string): MethodDecorator => {
  return function (
    target: object,
    propertyKey: string,
    _descriptor: PropertyDescriptor,
  ) {
    ElectronMetadata.menu.addRendererSubscription(
      target,
      propertyKey,
      event,
      'on',
    );
  } as MethodDecorator;
};
