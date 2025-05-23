export enum ReflectParam {
  Value = 'param.decorator:value',
}

/**
 * Injects an object passed with `string` or `symbol` identifier.
 */
export const Param = (identifier: string | symbol): ParameterDecorator => {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    index: number
  ) => {
    decorateParam(identifier, target, String(propertyKey), index);
  };
};

/**
 * Decorator as a wrapper function.
 */
export const decorateParam = (
  identifier: string | symbol,
  target: any,
  propertyKey: string,
  index: number
) => {
  // Get existing identifiers for this decorator.
  const identifiers =
    Reflect.getOwnMetadata(ReflectParam.Value, target[propertyKey]) || {};
  identifiers[index] = identifier;

  // Keep the token passed as identifier.
  Reflect.defineMetadata(ReflectParam.Value, identifiers, target[propertyKey]);
};
