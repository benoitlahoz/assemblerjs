import { OpenApiMetadataStorage } from '../metadata/openapi-metadata-storage';

/**
 * Excludes a handler or an entire controller from the generated OpenAPI spec.
 *
 * - On a method: excludes that handler only.
 * - On a class: excludes all routes of the controller.
 */
export const Hidden = () => {
  return (
    target: any,
    propertyKey?: string | symbol
  ): any => {
    if (propertyKey === undefined) {
      // Class decorator — target is the (possibly wrapped) class
      OpenApiMetadataStorage.ignoreController(target);
    } else {
      // Method decorator — target is the prototype
      OpenApiMetadataStorage.ignoreHandler(target.constructor, propertyKey);
    }
  };
};
