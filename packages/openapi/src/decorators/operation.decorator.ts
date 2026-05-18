import type { OperationMeta } from '../metadata/openapi-metadata.types';
import { OpenApiMetadataStorage } from '../metadata/openapi-metadata-storage';

/**
 * Enriches an HTTP handler's OpenAPI operation beyond what `info` provides.
 *
 * Priority for summary: `@Operation.summary` > `info` (2nd arg of `@Get`/`@Post`/etc.) > undefined.
 * The tag is always auto-derived from the controller path — this decorator cannot override it.
 */
export const Operation = (meta: OperationMeta): MethodDecorator => {
  return (target: any, propertyKey: string | symbol) => {
    OpenApiMetadataStorage.addOperation(target.constructor, propertyKey, meta);
  };
};
