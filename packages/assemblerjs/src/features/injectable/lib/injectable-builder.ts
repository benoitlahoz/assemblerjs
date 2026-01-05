import { registerEvents } from '@/features/events';
import { resolveInjectableParameters } from './dependencies';
import { AspectWeaver } from '@/features/aspects';
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
   * Also applies aspect weaving if aspects are defined.
   * @param configuration Optional runtime configuration to merge with the injectable's base configuration.
   * @returns The built instance (may be a Proxy if aspects are applied).
   */
  public build(configuration?: Record<string, any>): T {
    const mergedConfig = this.mergeConfiguration(configuration);
    const params = resolveInjectableParameters(this.injectable, mergedConfig);
    
    // Create the base instance
    const instance = new this.injectable.concrete(...params) as T;

    // Apply aspect weaving BEFORE registering events
    // Pass assemblage identifier for local configuration
    const wovenInstance = AspectWeaver.weave(
      instance,
      this.injectable.concrete,
      this.injectable.publicContext,
      this.injectable.concrete.name
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