import type { Concrete } from '@/types';
import { Injection, InstanceInjection } from '@/core/injection.types';
import { getOwnCustomMetadata } from './reflection.helpers';
import { ReflectDefinition } from './reflection.constants';

export interface AssemblageDefinition {
  singleton?: false;
  events?: string[];
  inject?: Injection<unknown>[];
  use?: InstanceInjection<unknown>[];
  tags?: string | string[];
  metadata?: Record<string, any>;
}

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
    transform: (value?: Injection<unknown>[][]) => value,
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

export const getDefinition = <T>(
  assemblage: Concrete<T>
): AssemblageDefinition => {
  return getOwnCustomMetadata(ReflectDefinition, assemblage);
};

export const getDefinitionValue = <T>(
  property: string,
  assemblage: Concrete<T>
): any => {
  const definition: Record<string, any> = getDefinition(assemblage);
  return definition[property];
};

export const setDefinitionValue = <T>(
  property: string,
  value: any,
  assemblage: Concrete<T>
): any => {
  const definition: Record<string, any> = getDefinition(assemblage);
  definition[property] = value;
  const safeDefinition = validateDefinition(definition);
  return safeDefinition;
};
