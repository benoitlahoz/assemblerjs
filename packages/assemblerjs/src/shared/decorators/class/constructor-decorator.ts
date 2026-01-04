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
 * Type for the callback function that will be executed after the constructor.
 * @template TInstance The type of the class instance
 * @template TDefinition The type of the definition/configuration object
 */
export type ConstructorDecoratorCallback<TInstance = any, TDefinition extends ObjectLiteral = ObjectLiteral> = 
  (this: TInstance, definition?: TDefinition) => void;

/**
 * Type for the decorator function.
 */
export type ConstructorDecoratorFunction = 
  <T extends new (...args: any[]) => any>(target: T) => T;

/**
 * Type for a function that creates a decorator.
 * @template TDefinition The type of the definition/configuration object
 */
export type DecoratorFactory<TDefinition extends ObjectLiteral = ObjectLiteral> =
  (definition?: TDefinition) => ConstructorDecoratorFunction;

/**
 * Create a custom decorator that adds a function called after the original constructor
 * and that can wrap an `Assemblage` with its own parameters decorator (e.g. @Use, @Context, ...).
 * The decorator can be placed above or below the `Assemblage` decorator.
 * The `definition` optional parameter allows passing a configuration object to the decorator.
 *
 * @template TInstance The type of the class instance (for type-safe access to `this`)
 * @template TDefinition The type of the definition/configuration object
 * @param fn A function to execute after `super`. Do not use arrow function here if access to `this` is required.
 * @returns A decorator function that accepts an optional definition and returns a ClassDecorator
 * 
 * @example
 * ```typescript
 * // Define your decorator with typed definition
 * interface LoggerConfig {
 *   prefix: string;
 *   enabled: boolean;
 * }
 * 
 * const Logger = createConstructorDecorator<MyClass, LoggerConfig>(function(config) {
 *   // `this` is typed as MyClass
 *   this.logPrefix = config?.prefix || 'LOG';
 * });
 * 
 * @Logger({ prefix: 'APP', enabled: true })
 * @Assemblage()
 * class MyClass implements AbstractAssemblage {
 *   logPrefix?: string;
 * }
 * ```
 */
export const createConstructorDecorator = <
  TInstance = any,
  TDefinition extends ObjectLiteral = ObjectLiteral
>(
  fn?: ConstructorDecoratorCallback<TInstance, TDefinition>
): DecoratorFactory<TDefinition> => {
  return (definition?: TDefinition) => ConstructorDecorator(fn, definition) as any;
};

/**
 * A custom decorator that adds a function called after the original constructor
 * and that can wrap an `Assemblage` with its own parameters decorator (e.g. @Use, @Context, ...).
 * The decorator can be placed above or below the `Assemblage` decorator.
 * The `definition` optional parameter allows passing a configuration object to the decorator.
 *
 * @template TDefinition The type of the definition/configuration object
 * @param fn A function to execute after `super`. Do not use arrow function here if access to `this` is required.
 * @param definition The configuration object to pass to the callback function
 * @returns A ClassDecorator
 */
export const ConstructorDecorator =
  <TDefinition extends ObjectLiteral = ObjectLiteral>(
    fn?: ConstructorDecoratorCallback<any, TDefinition>,
    definition?: TDefinition
  ) =>
  <TConstructor extends new (...args: any[]) => any>(Base: TConstructor): TConstructor => {
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
    ) as TConstructor;
  };
