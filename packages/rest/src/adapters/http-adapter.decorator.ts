import { getAssemblageDefinition, decorateAssemblage } from 'assemblerjs';

export const HTTP_ADAPTER_TAG = '__rest:http-adapter';

/**
 * Mark a class as the HTTP adapter for `@assemblerjs/rest`.
 *
 * Apply this decorator on the concrete adapter class (e.g. `ExpressAdapter`
 * or any subclass). `ControllerService` will discover it via
 * `context.tagged()` — the DI token can be anything.
 *
 * Must be placed above `@Assemblage()` so it runs after it:
 *
 * ```ts
 * @HttpAdapter()
 * @Assemblage()
 * class MyAdapter extends ExpressAdapter { ... }
 * ```
 */
export const HttpAdapter = (): ClassDecorator => {
  return (target: Function) => {
    const existing = getAssemblageDefinition(target as any) || {};
    const existingTags = existing.tags
      ? Array.isArray(existing.tags)
        ? existing.tags
        : [existing.tags]
      : [];
    decorateAssemblage(target as any, {
      ...existing,
      tags: [...existingTags, HTTP_ADAPTER_TAG],
    });
  };
};
