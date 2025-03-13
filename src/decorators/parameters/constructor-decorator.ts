import {
  defineCustomMetadata,
  getOwnCustomMetadata,
  ReflectParamTypes,
  ReflectValue,
} from '@/common';
import { decorateAssemblage } from '@/assemblage';
import { getDecoratedParametersIndexes } from './helpers';
import { ReflectParamIndex, ReflectParamValue } from './constants';
import { decorateUse } from './use';

/**
 * Create a custom decorator that adds a function called after the original constructor
 * and that can wrap an `Assemblage` with its own parameters decorator (e.g. @Use, @Context, ...).
 * Note that it must be placed before the `Assemnblage` decorator.
 *
 * @param { function(): void | undefined } fn A function to execute after `super`.
 * Do not use arrow function here if access to `this` is required.
 * @returns A new decorator.
 */
export const createConstructorDecorator = (fn?: () => void): any => {
  return (asAssemblage = true) => ConstructorDecorator(fn, asAssemblage);
};

/**
 * A custom decorator that adds a function called after the original constructor
 * and that can wrap an `Assemblage` with its own parameters decorator (e.g. @Use, @Context, ...).
 * Note that it must be placed before the `Assemnblage` decorator.
 *
 * @param { function(): void | undefined } fn A function to execute after `super`.
 * Do not use arrow function here if access to `this` is required.
 * @param { boolean | undefined } asAssemblage If `true` decorate the class as an assemblage (defaults to `true`).
 * @returns A new decorator.
 */
export const ConstructorDecorator =
  (fn?: () => void, asAssemblage = true): any =>
  <T extends { new (...args: any[]): {} }>(Base: T): any => {
    const klass = class extends Base {
      constructor(...args: any[]) {
        super(...args);
        if (fn) fn.call(this);
      }
    };

    // Change name to original class.
    Object.defineProperty(klass, 'name', { value: Base.name });

    if (!asAssemblage) {
      return klass;
    }

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

    if (!asAssemblage) return klass;

    // Return assemblage.
    return decorateAssemblage(
      klass,
      getOwnCustomMetadata(ReflectValue.AssemblageDefinition, Base)
    );
  };
