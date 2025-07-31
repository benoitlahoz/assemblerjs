import { MetadataStorage } from '@/metadata/metadata-storage';

export const HttpHeaders = (
  headers: Record<string, string>
): MethodDecorator => {
  return (target, propertyKey) => {
    MetadataStorage.addHttpHeaders(target, propertyKey, headers);
  };
};
