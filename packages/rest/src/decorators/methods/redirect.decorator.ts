import { MetadataStorage } from '@/metadata/metadata-storage';

export const Redirect = (
  location?: string,
  status?: number
): MethodDecorator => {
  return (target, propertyKey) => {
    MetadataStorage.addRedirect(target, propertyKey, location, status);
  };
};
