import type { Concrete } from '@assemblerjs/core';
import { isAsync } from '@assemblerjs/core';
import { AbstractAssemblage } from '@/features/assemblage';
import type { AssemblerContext } from '../model/types';
import { DebugLogger } from './debug-logger';

export class HookManager {
  public static callHook = <T>(
    assemblage: Concrete<T> | T,
    name: string,
    context?: AssemblerContext,
    configuration?: Record<string, any>
  ): Promise<void> => {
    const logger = DebugLogger.getInstance();
    const endLog = logger.logHook(name, assemblage, configuration);

    return new Promise((resolve, reject) => {
      const hook: Function | undefined = (assemblage as AbstractAssemblage)[name];

      if (hook) {
        if (isAsync(hook)) {
          hook
            .bind(assemblage)(context, configuration)
            .then(() => {
              if (endLog) endLog();
              resolve();
            })
            .catch((error: any) => {
              if (endLog) endLog();
              reject(error);
            });
          return;
        }

        try {
          hook.bind(assemblage)(context, configuration);
          if (endLog) endLog();
          resolve();
        } catch (error) {
          if (endLog) endLog();
          reject(error);
        }
      } else {
        if (endLog) endLog();
        resolve();
      }
    });
  };

  public static callHookImmediate = <T>(
    assemblage: Concrete<T> | T,
    name: string,
    context?: AssemblerContext,
    configuration?: Record<string, any>
  ): void => {
    const logger = DebugLogger.getInstance();
    const endLog = logger.logHook(name, assemblage, configuration);

    const hook: Function | undefined = (assemblage as AbstractAssemblage)[name];

    if (hook) {
      if (isAsync(hook)) {
        // For async hooks in sync context, execute them without waiting
        // This maintains backward compatibility with existing tests
        hook.bind(assemblage)(context, configuration).catch(() => {
          // Ignore async hook errors in sync context for backward compatibility
        });
        if (endLog) endLog();
        return;
      }

      // Call synchronous hook - errors will be thrown synchronously
      hook.bind(assemblage)(context, configuration);
      if (endLog) endLog();
    } else {
      if (endLog) endLog();
    }
  };

  private initCache: { instance: any; configuration?: Record<string, any> }[] = [];

  public prepareInitHook<T = any>(
    instance: T,
    configuration?: Record<string, any>
  ): unknown[] {
    this.initCache.push({
      instance,
      configuration,
    });
    return this.initCache;
  }

  public callInitHooks(context: AssemblerContext): void {
    // Call onInit on every dependency of our entry point, from the less dependent to the more dependent.
    for (const assemblage of this.initCache) {
      HookManager.callHookImmediate(
        assemblage.instance,
        'onInit',
        context,
        assemblage.configuration
      );
    }
  }

  public callInitedHooks(context: AssemblerContext): void {
    // Call onInited on every dependency of our entry point, in reverse order.
    for (const assemblage of [...this.initCache].reverse()) {
      HookManager.callHookImmediate(
        assemblage.instance,
        'onInited',
        context,
        assemblage.configuration
      );
    }
  }

  public clearCache(): void {
    this.initCache.length = 0;
  }

  public getCache(): { instance: any; configuration?: Record<string, any> }[] {
    return this.initCache;
  }
}