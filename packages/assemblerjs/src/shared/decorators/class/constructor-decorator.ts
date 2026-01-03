import {
  defineCustomMetadata,
  getOwnCustomMetadata,
  ReflectParamTypes,
  ReflectValue,
} from '@/shared/common';
import { decorateAssemblage } from '@/features/assemblage';
import type { ObjectLiteral } from '../types';
import { getDecoratedParametersIndexes, getParamIndexKey, getParamValueKey } from '../parameters/helpers';
import { ParameterDecoratorFactory } from '../parameters/parameter-decorator-factory';

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
 * Note that it must be placed before the `Assemblage` decorator.
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
    const registeredDecorators = ParameterDecoratorFactory.getRegisteredDecorators();

    for (let i = 0; i < paramTypes.length; i++) {
      let handled = false;

      // Iterate through all registered decorators dynamically
      for (const decoratorName of registeredDecorators) {
        if (existingParamsIndexes[decoratorName]?.includes(i)) {
          // Get the handler from the decorator's metadata
          const handler = ParameterDecoratorFactory.getDecoratorHandler(decoratorName);
          
          if (handler) {
            // Decorator with custom handler (like Use, Global)
            const values = getOwnCustomMetadata(
              getParamValueKey(decoratorName),
              Base
            );
            handler(values[i], klass, i);
          } else {
            // Simple decorator without handler (like Context, Definition, etc.)
            const paramIndexes: number[] =
              getOwnCustomMetadata(getParamIndexKey(decoratorName), Base) || [];
            paramIndexes.push(i);
            defineCustomMetadata(getParamIndexKey(decoratorName), paramIndexes, klass);
          }
          
          handled = true;
          break;
        }
      }

      // If parameter was not handled by any decorator, add to params if needed
      if (!handled && paramTypes[i]) {
        params.push(paramTypes[i]);
      }
    }

    // Return assemblage.
    return decorateAssemblage(
      klass,
      getOwnCustomMetadata(ReflectValue.AssemblageDefinition, Base)
    );
  };
