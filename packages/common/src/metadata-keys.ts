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
