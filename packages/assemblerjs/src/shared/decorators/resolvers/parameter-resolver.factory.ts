import { ResolverStore } from './resolver-store';

/**
 * Factory for creating parameter resolvers based on decorator types.
 * Uses the ResolverStore for dynamic resolver management.
 */
export class ParameterResolverFactory {
  /**
   * Gets a resolver instance for the given decorator type.
   * @param type The decorator type (e.g., 'Context', 'Configuration').
   * @returns The resolver instance.
   */
  static getResolver(type: string) {
    return ResolverStore.getResolver(type);
  }

  /**
   * Registers a new resolver for a decorator type.
   * @param type The decorator type.
   * @param resolverClass The resolver class constructor.
   */
  static registerResolver(type: string, resolverClass: new () => any): void {
    ResolverStore.register(type, resolverClass);
  }

  /**
   * Checks if a resolver is registered for the given type.
   * @param type The decorator type.
   * @returns True if a resolver is registered, false otherwise.
   */
  static hasResolver(type: string): boolean {
    return ResolverStore.hasResolver(type);
  }
}