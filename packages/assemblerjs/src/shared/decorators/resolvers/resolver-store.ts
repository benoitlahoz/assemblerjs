import type { ParameterResolver } from '../types';

/**
 * Registry for parameter resolvers.
 * Allows dynamic registration of resolvers for different decorator types.
 */
export class ResolverStore {
  private static resolvers: Map<string, new () => ParameterResolver> = new Map();

  /**
   * Registers a resolver for a specific decorator type.
   * @param type The decorator type (e.g., 'Context', 'Configuration').
   * @param resolverClass The resolver class constructor.
   */
  static register(type: string, resolverClass: new () => ParameterResolver): void {
    this.resolvers.set(type, resolverClass);
  }

  /**
   * Gets a resolver instance for the given decorator type.
   * @param type The decorator type.
   * @returns The resolver instance.
   * @throws Error if no resolver is found for the type.
   */
  static getResolver(type: string): ParameterResolver {
    const ResolverClass = this.resolvers.get(type);
    if (!ResolverClass) {
      throw new Error(`No resolver found for decorator type: ${type}`);
    }
    return new ResolverClass();
  }

  /**
   * Checks if a resolver is registered for the given type.
   * @param type The decorator type.
   * @returns True if a resolver is registered, false otherwise.
   */
  static hasResolver(type: string): boolean {
    return this.resolvers.has(type);
  }

  /**
   * Gets all registered resolver types.
   * @returns An array of registered decorator types.
   */
  static getRegisteredTypes(): string[] {
    return Array.from(this.resolvers.keys());
  }

  /**
   * Clears all registered resolvers.
   * Useful for testing or resetting the store.
   */
  static clear(): void {
    this.resolvers.clear();
  }
}