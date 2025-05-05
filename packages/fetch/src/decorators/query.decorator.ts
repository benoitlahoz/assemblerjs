export enum ReflectQuery {
  Value = 'query.decorator:value',
}

/**
 * Injects an object passed with `string` or `symbol` identifier.
 */
export const Query = (identifier: string | symbol): ParameterDecorator => {
  return (target: any, _: string | symbol | undefined, index: number) => {
    decorateQuery(identifier, target, index);
  };
};

/**
 * Decorator as a wrapper function.
 */
export const decorateQuery = (
  identifier: string | symbol,
  target: any,
  index: number
) => {
  // Get existing identifiers for this decorator.
  const identifiers = Reflect.getOwnMetadata(ReflectQuery.Value, target) || {};
  identifiers[index] = identifier;

  // Keep the token passed as identifier.
  Reflect.defineMetadata(ReflectQuery.Value, identifiers, target);
};
