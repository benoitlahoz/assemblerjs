import type { Injectable } from '@/features/injectable';
import type { ResolutionStrategy } from '../model/types';

/**
 * Resolution strategy for singleton assemblages.
 * Instances are cached and reused across all resolutions.
 */
export class SingletonStrategy implements ResolutionStrategy {
  private cache = new Map<string | symbol, any>();

  public resolve<T>(injectable: Injectable<T>, configuration?: Record<string, any>): T {
    const key = injectable.identifier as string | symbol;
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    // Build the instance (weaving happens in InjectableBuilder)
    const instance = injectable.build(configuration);

    // Merge configuration: base + runtime
    const mergedConfig = configuration ? { ...injectable.configuration, ...configuration } : injectable.configuration;
    injectable.setSingletonInstance(instance, mergedConfig);
    this.cache.set(key, instance);
    injectable.privateContext.prepareInitHook(instance, injectable.configuration);
    return instance;
  }
}

/**
 * Resolution strategy for transient assemblages.
 * A new instance is created for each resolution.
 */
export class TransientStrategy implements ResolutionStrategy {
  public resolve<T>(injectable: Injectable<T>, configuration?: Record<string, any>): T {
    // Build the instance (weaving happens in InjectableBuilder)
    const instance = injectable.build(configuration);

    injectable.privateContext.prepareInitHook(instance, injectable.configuration);
    return instance;
  }
}