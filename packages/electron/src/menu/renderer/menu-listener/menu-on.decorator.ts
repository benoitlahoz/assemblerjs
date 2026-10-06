import { ElectronMetadata } from '@/common/metadata';

/**
 * Listens to a menu event stream or to clicks matching a menu item ID.
 * Item-specific handlers receive the same MenuItemClickedEvent as itemClicked.
 */
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
