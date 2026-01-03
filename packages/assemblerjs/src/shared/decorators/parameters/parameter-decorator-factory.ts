import type { Concrete } from '@assemblerjs/core';
import { getOwnCustomMetadata, defineCustomMetadata } from '@/shared/common';
import type { ParameterResolver } from '../types';

/**
 * Handler function for custom decorator logic in constructor-decorator.
 * @param value The value stored for this parameter (e.g., identifier for Use/Global)
 * @param target The target class being decorated
 * @param index The parameter index
 */
export type DecoratorHandler = (value: any, target: any, index: number) => void;

/**
 * Configuration for creating a parameter decorator.
 */
export interface ParameterDecoratorConfig {
  /** The name of the decorator (e.g., 'Logger', 'Database') */
  name: string;
  /** How parameter values are stored */
  valueType?: 'single' | 'array' | 'map';
  /** The resolver class for this decorator */
  resolver: new () => ParameterResolver;
  /** Optional handler for custom decoration logic (e.g., for Use/Global decorators) */
  handler?: DecoratorHandler;
}

/**
 * Metadata about a registered decorator.
 */
interface DecoratorMetadata {
  name: string;
  valueType: 'single' | 'array' | 'map';
  handler?: DecoratorHandler;
}

/**
 * Factory for creating parameter decorators.
 * Decorators are responsible for registering their own resolvers.
 * This eliminates boilerplate code and ensures consistency across all decorators.
 */
export class ParameterDecoratorFactory {
  private static registeredDecorators = new Map<string, DecoratorMetadata>();

  /**
   * Creates a parameter decorator.
   * Note: Resolvers must be registered separately by the decorator implementation.
   * @param config The decorator configuration
   * @returns A parameter decorator function
   */
  public static create<T>(config: ParameterDecoratorConfig) {
    const { name, valueType = 'single', handler } = config;

    // Validation
    if (this.registeredDecorators.has(name)) {
      throw new Error(`Decorator ${name} already exists`);
    }

    // Generate reflection keys based on decorator name
    const PARAM_INDEX = `assemblage:${name.toLowerCase()}.param.index`;
    const PARAM_VALUE = `assemblage:${name.toLowerCase()}.param.value`;

    // Create the decorator
    const decorator = this.createDecoratorFunction<T>(PARAM_INDEX, PARAM_VALUE, valueType);

    // Register decorator with its metadata
    this.registeredDecorators.set(name, { name, valueType, handler });

    return decorator;
  }

  /**
   * Creates the actual decorator function.
   */
  private static createDecoratorFunction<T>(
    paramIndex: string,
    paramValue: string,
    valueType: 'single' | 'array' | 'map'
  ) {
    return (param: T): ParameterDecorator => {
      return (target: any, _: string | symbol | undefined, index: number) => {
        this.storeParameterData(param, target, index, paramIndex, paramValue, valueType);
      };
    };
  }

  /**
   * Stores parameter data using reflection metadata.
   */
  private static storeParameterData<T>(
    param: T,
    target: any,
    index: number,
    paramIndex: string,
    paramValue: string,
    valueType: 'single' | 'array' | 'map'
  ) {
    // 1. Store the index
    const indexes = getOwnCustomMetadata(paramIndex, target) || [];
    indexes.push(index);
    defineCustomMetadata(paramIndex, indexes, target);

    // 2. Store the value according to type
    switch (valueType) {
      case 'single': {
        defineCustomMetadata(paramValue, param, target);
        break;
      }
      case 'array': {
        const arrayValues = getOwnCustomMetadata(paramValue, target) || [];
        arrayValues[index] = param;
        defineCustomMetadata(paramValue, arrayValues, target);
        break;
      }
      case 'map': {
        const mapValues = getOwnCustomMetadata(paramValue, target) || {};
        mapValues[index] = param;
        defineCustomMetadata(paramValue, mapValues, target);
        break;
      }
    }
  }

  /**
   * Creates a helper function to get parameter indexes for a decorator.
   * @param paramIndexKey The reflection key for parameter indexes
   * @returns A function that retrieves indexes for a concrete class
   */
  public static createParameterIndexGetter(paramIndexKey: string) {
    return <T>(concrete: Concrete<T>): number[] => {
      return getOwnCustomMetadata(paramIndexKey, concrete) || [];
    };
  }

  /**
   * Creates a helper function to get parameter values for a decorator.
   * @param paramValueKey The reflection key for parameter values
   * @param valueType The type of value storage (currently unused but kept for future extensibility)
   * @returns A function that retrieves values for a concrete class
   */
  public static createParameterValueGetter(paramValueKey: string, _valueType: 'single' | 'array' | 'map') {
    // Note: valueType parameter is kept for API consistency and future use
    // Currently returns raw metadata, but could be enhanced to format based on valueType
    return <T>(concrete: Concrete<T>) => {
      return getOwnCustomMetadata(paramValueKey, concrete);
    };
  }

  /**
   * Gets all registered decorator names.
   * @returns Array of registered decorator names
   */
  public static getRegisteredDecorators(): string[] {
    return Array.from(this.registeredDecorators.keys());
  }

  /**
   * Checks if a decorator is registered.
   * @param name The decorator name
   * @returns True if registered, false otherwise
   */
  public static isRegistered(name: string): boolean {
    return this.registeredDecorators.has(name);
  }

  /**
   * Gets metadata for a registered decorator.
   * @param name The decorator name
   * @returns The decorator metadata or undefined if not found
   */
  public static getDecoratorMetadata(name: string): DecoratorMetadata | undefined {
    return this.registeredDecorators.get(name);
  }

  /**
   * Gets the handler for a decorator if it has one.
   * @param name The decorator name
   * @returns The handler function or undefined
   */
  public static getDecoratorHandler(name: string): DecoratorHandler | undefined {
    return this.registeredDecorators.get(name)?.handler;
  }
}