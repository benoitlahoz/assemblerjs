import { ReflectParamTypes, ReflectPrefix, ReflectSuffix } from './constants';

/**
 * Assemblage surrounds its own metadata keys by a prefix and a suffix:
 * define the custom metadata by inserting them.
 *
 * @param { string } name The name of the metadata.
 * @param { any } value The value to set.
 * @param { object } target The target of the metadata.
 */
export const defineCustomMetadata = (
  name: string,
  value: any,
  target: object
) => {
  Reflect.defineMetadata(
    `${ReflectPrefix}${name}${ReflectSuffix}`,
    value,
    target
  );
};

/**
 * Assemblage surrounds its own metadata keys by a prefix and a suffix:
 * get the custom metadata (including parent class) by inserting them.
 *
 * @param { string } name The name of the metadata.
 * @param { object } target The target of the metadata.
 * @returns { any } vThe value of the metadata for the property.
 */
export const getCustomMetadata = (name: string, target: object) => {
  return Reflect.getMetadata(`${ReflectPrefix}${name}${ReflectSuffix}`, target);
};

/**
 * Assemblage surrounds its own metadata keys by a prefix and a suffix:
 * get the custom own metadata by inserting them.
 *
 * @param { string } name The name of the metadata.
 * @param { object } target The target of the metadata.
 * @returns { any } vThe value of the metadata for the property.
 */
export const getOwnCustomMetadata = (name: string, target: object) => {
  return Reflect.getOwnMetadata(
    `${ReflectPrefix}${name}${ReflectSuffix}`,
    target
  );
};

export const getParamTypes = (target: object) => {
  return Reflect.getMetadata(ReflectParamTypes, target) || [];
};
