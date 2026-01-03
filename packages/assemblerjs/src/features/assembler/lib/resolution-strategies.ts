import type { Injectable } from '@/features/injectable';
import type { ResolutionStrategy } from '../model/types';

export class SingletonStrategy implements ResolutionStrategy {
  private cache = new Map<string | symbol, any>();

  public resolve<T>(injectable: Injectable<T>, configuration?: Record<string, any>): T {
    const key = injectable.identifier as string | symbol;
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    const instance = injectable.build(configuration);
    injectable.setSingletonInstance(instance);
    this.cache.set(key, instance);
    injectable.privateContext.prepareInitHook(instance, injectable.configuration);
    return instance;
  }
}

export class TransientStrategy implements ResolutionStrategy {
  public resolve<T>(injectable: Injectable<T>, configuration?: Record<string, any>): T {
    const instance = injectable.build(configuration);
    injectable.privateContext.prepareInitHook(instance, injectable.configuration);
    return instance;
  }
}