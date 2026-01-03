import type { Concrete } from '@assemblerjs/core';
import { isAsync } from '@assemblerjs/core';
import { AbstractAssemblage } from '@/features/assemblage';
import type { AssemblerContext } from '../model/types';

export class HookManager {
  public static callHook = <T>(
    assemblage: Concrete<T> | T,
    name: string,
    context?: AssemblerContext,
    configuration?: Record<string, any>
  ): Promise<void> => {
    return new Promise((resolve) => {
      const hook: Function | undefined = (assemblage as AbstractAssemblage)[name];

      if (hook) {
        if (isAsync(hook)) {
          hook
            .bind(assemblage)(context, configuration)
            .then(() => {
              resolve();
            });
          return;
        }

        resolve(hook.bind(assemblage)(context, configuration));
      }
    });
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
      HookManager.callHook(
        assemblage.instance,
        'onInit',
        context,
        assemblage.configuration
      );
    }
  }

  public callInitedHooks(context: AssemblerContext): void {
    // Call onInited on every dependency of our entry point, in reverse order.
    for (const assemblage of this.initCache.reverse()) {
      HookManager.callHook(
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