import {
  addMenuItemHandleInMainMetadata,
  getMenuItemHandleInMainMetadata,
} from '@/universal/metadata';

export function HandleInMain(): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    _descriptor: PropertyDescriptor,
  ) => {
    if (typeof propertyKey !== 'string') {
      throw new Error('@HandleInMain supports string method names only.');
    }

    addMenuItemHandleInMainMetadata(target, propertyKey);
  };
}

export function getHandleInMainMethods(target: Function): Set<string> {
  return new Set(
    getMenuItemHandleInMainMetadata(target).map((entry) => entry.method),
  );
}
