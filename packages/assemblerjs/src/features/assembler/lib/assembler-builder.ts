import type { Concrete } from '@assemblerjs/core';
import { setDefinitionValue } from '@/features/assemblage';
import { HookManager } from './hook-manager';
import { DebugLogger } from './debug-logger';
import { CycleDetector } from './cycle-detector';
import { formatIdentifier } from './injectable-manager';

export class AssemblerBuilder {
  constructor(private assembler: any) {}

  public build<T>(entry: Concrete<T>, configuration?: Record<string, any>): T {
    const logger = DebugLogger.getInstance();

    // Entry assemblage is always a singleton.
    setDefinitionValue('singleton', true, entry);

    // Phase: Registration
    logger.logPhaseStart('registration');
    const injectable = this.assembler.register([entry]);
    
    // Get list of registered identifiers
    const registeredIdentifiers = this.assembler.injectableManager.getRegisteredIdentifiers();
    logger.logPhaseEnd('registration', undefined, { registered: registeredIdentifiers });

    // Detect circular dependencies (NoOp if disabled, Active if enabled)
    const cycles = CycleDetector.getInstance().detect(
      this.assembler.injectableManager.getInjectables(),
      (id) => formatIdentifier(id)
    );
    if (cycles.length > 0) {
      for (const cycle of cycles) {
        logger.log('error', 'Circular dependency detected', {
          cycle: cycle.cycle,
          path: cycle.path,
        });
      }
    }

    // Phase: Resolution
    logger.logPhaseStart('resolution');
    const instance = this.assembler.require(injectable.identifier, configuration);
    logger.logPhaseEnd('resolution');

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
    logger.logPhaseStart('hooks:onInit');
    this.assembler.hookManager.callInitHooks(this.assembler.publicContext);

    // Call hook on entry assemblage with the configuration passed to build().
    const mergedConfig = configuration ? { ...injectable.configuration, ...configuration } : injectable.configuration;
    HookManager.callHookImmediate(
      instance,
      'onInit',
      this.assembler.publicContext,
      mergedConfig
    );
    logger.logPhaseEnd('hooks:onInit');

    // Call onInited on every dependency of our entry point, in reverse order.
    logger.logPhaseStart('hooks:onInited');
    this.assembler.hookManager.callInitedHooks(this.assembler.publicContext);

    HookManager.callHookImmediate(
      instance,
      'onInited',
      this.assembler.publicContext,
      mergedConfig
    );
    logger.logPhaseEnd('hooks:onInited');

    // Clean up.
    this.assembler.hookManager.clearCache();

    return instance as T;
  }
}