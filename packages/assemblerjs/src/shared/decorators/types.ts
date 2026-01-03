import { Concrete } from "@assemblerjs/core";
import { AbstractInjectable } from "@/features/injectable";


export interface ObjectLiteral {
  [key: string]: any;
}

/**
 * Dynamic record of parameter decorator indexes.
 * Keys are decorator names (e.g., 'Context', 'Use', 'Global', etc.)
 * Values are arrays of parameter indexes where the decorator is applied.
 */
export interface ParametersDecoratorsIndexes {
  [decoratorName: string]: number[];
}

/**
 * Interface for parameter resolvers that handle different types of injection.
 */
export interface ParameterResolver {
  /**
   * Resolves a parameter value for a given index.
   * @param index The parameter index in the constructor.
   * @param injectable The injectable instance.
   * @param concrete The concrete class being instantiated.
   * @param config Optional merged configuration.
   * @returns The resolved parameter value.
   */
  resolve(index: number, injectable: AbstractInjectable<any>, concrete: Concrete<any>, config?: Record<string, any>): any;
}