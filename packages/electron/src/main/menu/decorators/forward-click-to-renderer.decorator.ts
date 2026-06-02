import {
  addMenuItemForwardToRendererMetadata,
  getMenuItemForwardToRendererMetadata,
} from '@/universal/metadata';

export function ForwardClickToRenderer(): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    _descriptor: PropertyDescriptor,
  ) => {
    if (typeof propertyKey !== 'string') {
      throw new Error(
        '@ForwardClickToRenderer supports string method names only.',
      );
    }

    addMenuItemForwardToRendererMetadata(target, propertyKey);
  };
}

export function getForwardToRendererMethods(target: Function): Set<string> {
  return new Set(
    getMenuItemForwardToRendererMetadata(target).map((entry) => entry.method),
  );
}
