export enum ReflectPlaceholder {
  Value = 'placeholder.decorator:value',
}

/**
 * Injects an object passed with `string` or `symbol` identifier.
 */
export const Placeholder = (
  identifier: string | symbol
): ParameterDecorator => {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    index: number
  ) => {
    decoratePlaceholder(identifier, target, String(propertyKey), index);
  };
};

/**
 * Decorator as a wrapper function.
 */
export const decoratePlaceholder = (
  identifier: string | symbol,
  target: any,
  propertyKey: string,
  index: number
) => {
  // Get existing identifiers for this decorator.
  const identifiers =
    Reflect.getOwnMetadata(ReflectPlaceholder.Value, target[propertyKey]) || {};
  identifiers[index] = identifier;

  // Keep the token passed as identifier.
  Reflect.defineMetadata(
    ReflectPlaceholder.Value,
    identifiers,
    target[propertyKey]
  );
};
