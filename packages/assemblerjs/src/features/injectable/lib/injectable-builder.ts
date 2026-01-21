import { registerEvents } from '@/features/events';
import { resolveInjectableParameters } from './dependencies';
import { TransversalWeaver } from '@/features/transversals';
import type { AbstractInjectable } from '../model/abstract';

/**
 * Handles the building of injectable instances, including parameter resolution and configuration merging.
 */
export class InjectableBuilder<T> {
  /**
   * Creates an instance of InjectableBuilder.
   * @param injectable The injectable to build instances for.
   */
  constructor(private injectable: AbstractInjectable<T>) {}

  /**
   * Builds a new instance of the injectable's concrete class.
   * Resolves constructor parameters, merges configurations, and registers events.
   * Also applies transversal weaving if aspects are defined.
   * @param configuration Optional runtime configuration to merge with the injectable's base configuration.
   * @returns The built instance (may be a Proxy if aspects are applied).
   */
  public build(configuration?: Record<string, any>): T {
    const mergedConfig = this.mergeConfiguration(configuration);
    
    // Build the base instance
    let instance: T;

    // If an instance was pre-provided (use: with instance), return it directly.
    if ((this.injectable as any).singletonInstance) {
      return (this.injectable as any).singletonInstance as T;
    }
    
    if (this.injectable.factory) {
      // If this injectable wraps a factory, execute it
      instance = this.injectable.factory() as T;
    } else if (this.injectable.concrete) {
      // Otherwise, resolve parameters and instantiate the concrete class
      const params = resolveInjectableParameters(this.injectable, mergedConfig);
      instance = new this.injectable.concrete(...params) as T;
    } else {
      throw new Error(
        `Injectable with identifier '${String(this.injectable.identifier)}' has neither concrete class nor factory.`
      );
    }

    // Apply transversal weaving BEFORE registering events
    // Pass assemblage identifier for local configuration
    const concreteClass = this.injectable.concrete || (instance as any).constructor;
    const wovenInstance = TransversalWeaver.weave(
      instance,
      concreteClass,
      this.injectable.publicContext
    );

    // Add event channels to eventual subclass of `EventManager` and forward to Assembler.
    registerEvents(this.injectable, wovenInstance);

    return wovenInstance;
  }

  /**
   * Merges the injectable's base configuration with optional runtime configuration.
   * Runtime configuration takes precedence over base configuration.
   * @param configuration Optional runtime configuration.
   * @returns The merged configuration object.
   */
  private mergeConfiguration(configuration?: Record<string, any>): Record<string, any> {
    const baseConfig = this.injectable.configuration || {};
    if (configuration) {
      return { ...baseConfig, ...configuration };
    }
    return baseConfig;
  }
}