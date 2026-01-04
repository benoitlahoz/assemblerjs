import type { Concrete } from '@assemblerjs/core';
import { setDefinitionValue } from '@/features/assemblage';
import { HookManager } from './hook-manager';

export class AssemblerBuilder {
  constructor(private assembler: any) {}

  public build<T>(entry: Concrete<T>, configuration?: Record<string, any>): T {
    // Entry assemblage is always a singleton.
    setDefinitionValue('singleton', true, entry);

    // Recursively register dependencies beginning from the entry concrete class.
    const injectable = this.assembler.register([entry]);

    // Instance of entry assemblage will build recursively every dependency.
    const instance = this.assembler.require(injectable.identifier, configuration);

    // Remove entry instance from cache.
    const root = this.assembler.hookManager.getCache().find(
      (value: { instance: any; configuration?: Record<string, any> }) =>
        value.instance === instance
    );
    if (!root) {
      throw new Error('Root instance not found in assemblages cache.');
    }

    const index = this.assembler.hookManager.getCache().indexOf(root);
    this.assembler.hookManager.getCache().splice(index, 1);

    // Call onInit on every dependency of our entry point, from the less dependent to the more dependent.
    this.assembler.hookManager.callInitHooks(this.assembler.publicContext);

    // Call hook on entry assemblage with the configuration passed to build().
    const mergedConfig = configuration ? { ...injectable.configuration, ...configuration } : injectable.configuration;
    HookManager.callHookImmediate(
      instance,
      'onInit',
      this.assembler.publicContext,
      mergedConfig
    );

    // Call onInited on every dependency of our entry point, in reverse order.
    this.assembler.hookManager.callInitedHooks(this.assembler.publicContext);

    HookManager.callHookImmediate(
      instance,
      'onInited',
      this.assembler.publicContext,
      mergedConfig
    );

    // Clean up.
    this.assembler.hookManager.clearCache();

    return instance as T;
  }
}