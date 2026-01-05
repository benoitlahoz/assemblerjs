import type { Abstract, Concrete } from '@assemblerjs/core';
import type { Identifier } from '@/shared/common';

/**
 * Aspect configuration with role and method filtering.
 * Allows to configure which advice role applies to which methods.
 */
export interface AspectConfig<T = any> {
  /** The aspect class or identifier */
  aspect: Identifier<T>;
  /** Optional role to select specific advices from the aspect */
  role?: string;
  /** Optional method filter: array of method names, predicate function, or '*' for all */
  methods?: string[] | ((methodName: string) => boolean) | '*';
  /** Optional configuration passed to the aspect */
  config?: Record<string, any>;
}

/**
 * Aspect injection definition.
 * An aspect can be injected with or without configuration.
 * Supports both direct injection, abstraction pattern, and advanced configuration with roles.
 * 
 * @example
 * ```typescript
 * // Without configuration (backward compatible)
 * aspects: [[LoggingAspect]]
 * 
 * // With configuration (backward compatible)
 * aspects: [[LoggingAspect, { level: 'debug' }]]
 * 
 * // With abstraction (like inject[])
 * aspects: [[AbstractLoggingAspect, LoggingAspect]]
 * 
 * // With abstraction and configuration
 * aspects: [[AbstractLoggingAspect, LoggingAspect, { level: 'debug' }]]
 * 
 * // NEW: With role and method filtering
 * aspects: [
 *   {
 *     aspect: LoggingAspect,
 *     role: 'method-entry',
 *     methods: ['create', 'update']
 *   },
 *   {
 *     aspect: LoggingAspect,  // Same aspect, different config
 *     role: 'method-exit',
 *     methods: '*'
 *   }
 * ]
 * 
 * // NEW: With abstraction and role configuration
 * aspects: [
 *   {
 *     aspect: [AbstractLoggingAspect, LoggingAspect],
 *     role: 'audit',
 *     methods: (name) => name.startsWith('delete')
 *   }
 * ]
 * ```
 */
export type AspectInjection<T> = 
  | [Identifier<T>]
  | [Identifier<T>, Record<string, any>]
  | [Abstract<T>, Concrete<T>]
  | [Abstract<T>, Concrete<T>, Record<string, any>]
  | AspectConfig<T>;
