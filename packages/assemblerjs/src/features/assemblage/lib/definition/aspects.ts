import type { Identifier } from '@/shared/common';

/**
 * Aspect injection definition.
 * An aspect can be injected with or without configuration.
 * 
 * @example
 * ```typescript
 * // Without configuration
 * aspects: [[LoggingAspect]]
 * 
 * // With configuration
 * aspects: [[LoggingAspect, { level: 'debug' }]]
 * ```
 */
export type AspectInjection<T> = 
  | [Identifier<T>]
  | [Identifier<T>, Record<string, any>];
