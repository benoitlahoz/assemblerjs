import { OpenApiMetadataStorage } from '../metadata/openapi-metadata-storage';

/**
 * Documents an error response for a handler.
 *
 * @param status  HTTP status code (e.g. 400, 404, 500).
 * @param description  Optional human-readable description.
 */
export const Throws = (
  status: number,
  description?: string
): MethodDecorator => {
  return (target: any, propertyKey: string | symbol) => {
    OpenApiMetadataStorage.addResponse(target.constructor, propertyKey, {
      kind: 'throws',
      status,
      description,
    });
  };
};
