import type { Abstract, Concrete } from '@assemblerjs/core';
import type { Identifier } from '@/shared/common';

/**
 * Aspect injection definition.
 * An aspect can be injected with or without configuration.
 * Supports both direct injection and abstraction pattern.
 * 
 * @example
 * ```typescript
 * // Without configuration
 * aspects: [[LoggingAspect]]
 * 
 * // With configuration
 * aspects: [[LoggingAspect, { level: 'debug' }]]
 * 
 * // With abstraction (like inject[])
 * aspects: [[AbstractLoggingAspect, LoggingAspect]]
 * 
 * // With abstraction and configuration
 * aspects: [[AbstractLoggingAspect, LoggingAspect, { level: 'debug' }]]
 * ```
 */
export type AspectInjection<T> = 
  | [Identifier<T>]
  | [Identifier<T>, Record<string, any>]
  | [Abstract<T>, Concrete<T>]
  | [Abstract<T>, Concrete<T>, Record<string, any>];
