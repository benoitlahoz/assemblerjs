/**
 * Monorepo-wide metadata key conventions.
 *
 * Format convention:
 *   assemblerjs:<domain>:<name>
 */

export const MetadataKeyNamespace = 'assemblerjs';

export const buildMetadataKey = (scope: string, name: string): string => {
  if (!scope || !name) {
    throw new Error('scope and name are required to build metadata keys');
  }

  return `${MetadataKeyNamespace}:${scope}:${name}`;
};

export const buildDecoratorParameterKey = (name: string): string =>
  buildMetadataKey('param', name);

export const DecoratorParameterMetadataKeys = {
  body: buildDecoratorParameterKey('body'),
  query: buildDecoratorParameterKey('query'),
  param: buildDecoratorParameterKey('param'),
  header: buildDecoratorParameterKey('header'),
  placeholder: buildDecoratorParameterKey('placeholder'),
} as const;

/**
 * Legacy keys currently found in packages.
 * Kept here to support staged migrations.
 */
export const LegacyDecoratorMetadataKeys = {
  fetchBody: 'fetch:body.decorator',
  fetchQuery: 'fetch:query.decorator',
  fetchParam: 'fetch:param.decorator',
  fetchHeader: 'fetch:header.decorator',
  fetchPlaceholder: 'fetch:placeholder.decorator',

  restParametersContainer: 'parameters',
  restBodyProperty: 'body',
  restQueryProperty: 'query',
  restParamProperty: 'param',
  restHeaderProperty: 'header',
} as const;
