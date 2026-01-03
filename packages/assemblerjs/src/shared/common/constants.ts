/**
 * Base `Reflect` param types used to get constructor's parameters.
 */
export const ReflectParamTypes = 'design:paramtypes';
/**
 * Prefix used by `assembler.js` to wrap its own metadata keys.
 */
export const ReflectPrefix = '__';
/**
 * Suffix used by `assembler.js` to wrap its own metadata keys.
 */
export const ReflectSuffix = '__';
/**
 * Internal `Reflect` boolean flags.
 */
export enum ReflectFlags {
  IsAssemblage = 'is_assemblage',
}
/**
 * Internal `Reflect` values.
 */
export enum ReflectValue {
  AssemblageDefinition = 'assemblage:definition.value',
  AssemblageContext = 'assemblage:context.value',
}
