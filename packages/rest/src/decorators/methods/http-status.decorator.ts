import { MetadataStorage } from '@/metadata/metadata-storage';

export const HttpStatus = (status: number): MethodDecorator => {
  return (target, propertyKey) => {
    MetadataStorage.addHttpStatus(target, propertyKey, status);
  };
};
