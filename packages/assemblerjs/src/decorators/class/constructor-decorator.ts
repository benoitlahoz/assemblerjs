import {
  defineCustomMetadata,
  getOwnCustomMetadata,
  ReflectParamTypes,
  ReflectValue,
} from '@/common';
import { decorateAssemblage } from '@/assemblage';
import type { ObjectLiteral } from '../types';
import { getDecoratedParametersIndexes } from '../parameters/helpers';
import { ReflectParamIndex, ReflectParamValue } from '../parameters/constants';
import { decorateUse } from '../parameters/use';

/**
 * Create a custom decorator that adds a function called after the original constructor
 * and that can wrap an `Assemblage` with its own parameters decorator (e.g. @Use, @Context, ...).
 * Note that it must be placed before the `Assemblage` decorator.
 * The `definition` optional parameter allows passing a configuration object to the decorator.
 *
 * @param { function(definition?: ObjectLiteral): void | undefined } fn A function to execute after `super`.
 * Do not use arrow function here if access to `this` is required.
 * @returns A new decorator.
 */
export const createConstructorDecorator = <T extends ObjectLiteral>(
  fn?: (definition?: T) => void
): any => {
  return (definition?: T) => ConstructorDecorator(fn, definition);
};

/**
 * A custom decorator that adds a function called after the original constructor
 * and that can wrap an `Assemblage` with its own parameters decorator (e.g. @Use, @Context, ...).
 * Note that it must be placed before the `Assemnblage` decorator.
 * The `definition` optional parameter allows passing a configuration object to the decorator.
 *
 * @param { function(definition?: ObjectLiteral): void | undefined } fn A function to execute after `super`.
 * Do not use arrow function here if access to `this` is required.
 * @param { boolean | undefined } asAssemblage If `true` decorate the class as an assemblage (defaults to `true`).
 * @returns A new decorator.
 */
export const ConstructorDecorator =
  <T extends ObjectLiteral>(
    fn?: (definition?: T) => void,
    definition?: T
  ): any =>
  // eslint-disable-next-line
  <T extends { new (...args: any[]): {} }>(Base: T): any => {
    const klass = class extends Base {
      constructor(...args: any[]) {
        super(...args);
        if (fn) fn.call(this, definition);
      }
    };

    // Change name to original class.
    Object.defineProperty(klass, 'name', { value: Base.name });

    const paramTypes: any[] =
      Reflect.getOwnMetadata(ReflectParamTypes, Base) || [];
    const existingParamsIndexes = getDecoratedParametersIndexes(Base);
    const params: any[] = [];

    for (let i = 0; i < paramTypes.length; i++) {
      if (existingParamsIndexes.Context.includes(i)) {
        const paramIndexes: number[] =
          getOwnCustomMetadata(ReflectParamIndex.Context, Base) || [];
        paramIndexes.push(i);
        defineCustomMetadata(ReflectParamIndex.Context, paramIndexes, klass);
        continue;
      }

      if (existingParamsIndexes.Definition.includes(i)) {
        const paramIndexes: number[] =
          getOwnCustomMetadata(ReflectParamIndex.Definition, Base) || [];
        paramIndexes.push(i);
        defineCustomMetadata(ReflectParamIndex.Definition, paramIndexes, klass);
        continue;
      }

      if (existingParamsIndexes.Configuration.includes(i)) {
        const paramIndexes: number[] =
          getOwnCustomMetadata(ReflectParamIndex.Configuration, Base) || [];
        paramIndexes.push(i);
        defineCustomMetadata(
          ReflectParamIndex.Configuration,
          paramIndexes,
          klass
        );
        continue;
      }

      if (existingParamsIndexes.Dispose.includes(i)) {
        const paramIndexes: number[] =
          getOwnCustomMetadata(ReflectParamIndex.Dispose, Base) || [];
        paramIndexes.push(i);
        defineCustomMetadata(ReflectParamIndex.Dispose, paramIndexes, klass);
        params.push(paramTypes[i]);
        continue;
      }

      if (existingParamsIndexes.Use.includes(i)) {
        // Get identifiers for Base class.
        const identifiers = getOwnCustomMetadata(
          ReflectParamValue.UseIdentifier,
          Base
        );
        decorateUse(identifiers[i], klass, i);
        continue;
      }
    }

    // Return assemblage.
    return decorateAssemblage(
      klass,
      getOwnCustomMetadata(ReflectValue.AssemblageDefinition, Base)
    );
  };
