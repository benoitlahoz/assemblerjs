import type { Concrete } from '@assemblerjs/core';
import { isAsync } from '@assemblerjs/core';
import { AbstractAssemblage } from '@/features/assemblage';
import type { AssemblerContext } from './types';

/**
 * Call a hook of an assemblage asynchronously.
 * Resolve immediately if the hook is synchronous.
 *
 * @param { Concrete<T> | T } assemblage An assemblage class or instance of a class of type T.
 * @param { string } name The name of the hook.
 * @param { AssemblerContext } context The assembler's context.
 */
export const callHook = <T>(
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
