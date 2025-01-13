import type { Concrete } from '@/common/types';
import { ReflectValue } from '@/common/constants';
import { defineCustomMetadata, getOwnCustomMetadata } from '@/common';
import { isAssemblage } from '../helpers';
import type { Injection } from './inject';
import type { InstanceInjection } from './use';
import { AssemblageDefinition } from './types';

/**
 * Provides functions to test that an `AssemblageDefinition` is conform
 * and eventually transform its values.
 */
const schema: Record<string, any> = {
  singleton: {
    test: (value: unknown) =>
      typeof value === 'boolean' || typeof value === 'undefined',
    throw: () => {
      throw new Error(
        `'singleton' property must be of type 'boolean' or 'undefined'.`
      );
    },
    // Assemblages are singletons by default.
    transform: (value?: false) => (typeof value === 'undefined' ? true : false),
  },
  events: {
    test: (value: unknown) =>
      typeof value === 'undefined' ||
      (Array.isArray(value) &&
        value.every((item: unknown) => typeof item === 'string')),
    throw: () => {
      throw new Error(
        `'events' property must be an array of strings or 'undefined'.`
      );
    },
    transform: (value?: string[]) => value,
  },
  inject: {
    test: (value: unknown) =>
      typeof value === 'undefined' ||
      (Array.isArray(value) &&
        value.every(
          (item: unknown) =>
            Array.isArray(item) && item.length >= 1 && item.length <= 3
        )),
    throw: () => {
      throw new Error(
        `'inject' property must be an array of tuples of length 1, 2 or 3.`
      );
    },
    transform: (value?: Injection<unknown>[][]) => value,
  },
  use: {
    test: (value: unknown) =>
      typeof value === 'undefined' ||
      (Array.isArray(value) &&
        value.every(
          (item: unknown) => Array.isArray(item) && item.length == 2
        )),
    throw: () => {
      throw new Error(`'use' property must be an array of tuples of length 2.`);
    },
    transform: (value?: InstanceInjection<unknown>[][]) => value,
  },
  tags: {
    test: (value: unknown) =>
      typeof value === 'undefined' ||
      typeof value === 'string' ||
      (Array.isArray(value) &&
        value.every((item: unknown) => typeof item === 'string')),
    throw: () => {
      throw new Error(
        `'tags' property must be a string or an array of strings.`
      );
    },
    transform: (value?: string | string[]) =>
      typeof value === 'string' ? [value] : value,
  },
  metadata: {
    test: (value: unknown) =>
      (typeof value === 'object' || typeof value === 'undefined') &&
      !Array.isArray(value),
    throw: () => {
      throw new Error(
        `'metadata' property must be of type 'object' or 'undefined'.`
      );
    },
    transform: (value?: Record<string, any>) => value,
  },
};

/**
 * Validate an object passed as `AssemblageDefinition`.
 *
 * @param { Record<string, any> } obj The object to validate against `AssemblageDefinition` schema.
 * @returns { Record<string, any> } A valid `AssemblageDefinition` object.
 */
export const validateDefinition = (obj: Record<string, any>) => {
  const res = { ...obj };
  for (const property in res) {
    if (!Object.keys(schema).includes(property)) {
      throw new Error(
        `Property '${property}' is not a valid assemblage definition property.`
      );
    }

    const test = schema[property].test;
    const error = schema[property].throw;
    const transform = schema[property].transform;

    if (!test(res[property])) {
      error();
    }

    res[property] = transform(res[property]);
  }

  return res;
};

/**
 * Get the raw definition of a given assemblage.
 *
 * @param { Concrete<T> } assemblage The assemblage.
 * @returns { AssemblageDefinition } The definition.
 */
export const getDefinition = <T>(
  assemblage: Concrete<T>
): AssemblageDefinition => {
  if (!isAssemblage(assemblage)) {
    throw new Error(`Class '${assemblage.name}' is not an assemblage.`);
  }
  return getOwnCustomMetadata(ReflectValue.AssemblageDefinition, assemblage);
};

/**
 * Get a value from the raw definition of a given assemblage.
 *
 * @param { keyof AssemblageDefinition } property The property to get.
 * @param { Concrete<T> } assemblage The assemblage.
 * @returns { any } The value for given property.
 */
export const getDefinitionValue = <T>(
  property: string,
  assemblage: Concrete<T>
): any => {
  const definition: Record<string, any> = getDefinition(assemblage);
  return definition[property];
};

/**
 * Set a value to the definition of a given assemblage and validate the result.
 *
 * @param { keyof AssemblageDefinition } property The property to set.
 * @param { any } value The value to set.
 * @param { Concrete<T> } assemblage The assemblage.
 * @returns { AssemblageDefinition } The resulting `AssemblageDefinition`.
 */
export const setDefinitionValue = <T>(
  property: string,
  value: any,
  assemblage: Concrete<T>
): any => {
  const definition: Record<string, any> = getDefinition(assemblage);
  definition[property] = value;
  const safeDefinition = validateDefinition(definition);

  // Change metadata of the assemblage.
  defineCustomMetadata(
    ReflectValue.AssemblageDefinition,
    safeDefinition,
    assemblage
  );

  return safeDefinition;
};
