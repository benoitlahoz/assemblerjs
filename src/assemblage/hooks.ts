import type { Concrete } from '@/types';
import { isAsync } from '@/common/utils';
import type { AssemblerContext } from '@/assembler/types';
import { AbstractAssemblage } from './types';

/**
 * Call a hook of an assemblage asynchronously.
 * Resolve immediately if the hook is not asynchronous.
 *
 * @param { Concrete<T> | T } assemblage An assemblage class or instance of a class of type T.
 * @param { string } name The name of the hook.
 * @param { AssemblerContext } context The assembler's context.
 */
export const callHook = <T>(
  assemblage: Concrete<T> | T,
  name: string,
  context?: AssemblerContext
): Promise<void> => {
  return new Promise((resolve) => {
    const hook: Function | undefined = (assemblage as AbstractAssemblage)[name];

    if (hook) {
      if (isAsync(hook)) {
        hook
          .bind(assemblage)(context)
          .then(() => {
            resolve();
          });
        return;
      }
      resolve(hook.bind(assemblage)(context));
    }
  });
};
