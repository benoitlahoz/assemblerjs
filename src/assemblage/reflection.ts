export const ReflectParamTypes = 'design:paramtypes';

export const ReflectPrefix = '__';
export const ReflectSuffix = '__';

export const ReflectIsAssemblageFlag = `is_assemblage`;

export const ReflectDefinition = 'assemblage_definition';

export const ReflectContextParamIndex = `context_param_index`;
export const ReflectConfigurationParamIndex = `config_param_index`;
export const ReflectDefinitionParamIndex = `definition_param_index`;

/**
 * Assemblage surrounds its own metadata keys by a prefix and a suffix:
 * define the custom metadata by inserting them.
 *
 * @param { string } name The name of the metadata.
 * @param { any } value The value to set.
 * @param { Object } target The target of the metadata.
 */
export const defineCustomMetadata = (
  name: string,
  value: any,
  target: Object
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
 * @param { Object } target The target of the metadata.
 * @returns { any } vThe value of the metadata for the property.
 */
export const getCustomMetadata = (name: string, target: Object) => {
  return Reflect.getMetadata(`${ReflectPrefix}${name}${ReflectSuffix}`, target);
};

/**
 * Assemblage surrounds its own metadata keys by a prefix and a suffix:
 * get the custom own metadata by inserting them.
 *
 * @param { string } name The name of the metadata.
 * @param { Object } target The target of the metadata.
 * @returns { any } vThe value of the metadata for the property.
 */
export const getOwnCustomMetadata = (name: string, target: Object) => {
  return Reflect.getOwnMetadata(
    `${ReflectPrefix}${name}${ReflectSuffix}`,
    target
  );
};

export const getParamTypes = (target: Object) => {
  return Reflect.getMetadata(ReflectParamTypes, target) || [];
};
