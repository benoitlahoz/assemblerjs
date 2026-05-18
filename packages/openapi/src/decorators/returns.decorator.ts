import { OpenApiMetadataStorage } from '../metadata/openapi-metadata-storage';

/**
 * Documents a successful response for a handler.
 *
 * @param status  HTTP status code (e.g. 200, 201).
 * @param dtoClass  Optional DTO class — schema will be auto-extracted via `DtoSchemaExtractor`.
 * @param description  Optional human-readable description.
 */
export const Returns = (
  status: number,
  dtoClass?: Function,
  description?: string
): MethodDecorator => {
  return (target: any, propertyKey: string | symbol) => {
    OpenApiMetadataStorage.addResponse(target.constructor, propertyKey, {
      kind: 'returns',
      status,
      dtoClass,
      description,
    });
  };
};
