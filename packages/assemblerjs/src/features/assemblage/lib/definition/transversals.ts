import type { Abstract, Concrete } from '@assemblerjs/core';
import type { Identifier } from '@/shared/common';

/**
 * Transversal injection definition.
 * A transversal can be injected with or without configuration.
 * Supports both direct injection, abstraction pattern, and advanced configuration with roles.
 * 
 * @example
 * ```typescript
 * // Without configuration (backward compatible)
 * transversals: [[LoggingTransversal]]
 * 
 * // With configuration (backward compatible)
 * transversals: [[LoggingTransversal, { level: 'debug' }]]
 * 
 * // With abstraction (like inject[])
 * transversals: [[AbstractLoggingTransversal, LoggingTransversal]]
 * 
 * // With abstraction and configuration
 * transversals: [[AbstractLoggingTransversal, LoggingTransversal, { level: 'debug' }]]
 * 
 * // NEW: With role and method filtering
 * transversals: [
 *   {
 *     transversal: LoggingTransversal,
 *     role: 'method-entry',
 *     methods: ['create', 'update']
 *   },
 *   {
 *     transversal: LoggingTransversal,  // Same transversal, different config
 *     role: 'method-exit',
 *     methods: '*'
 *   }
 * ]
 * 
 * // NEW: With abstraction and role configuration
 * transversals: [
 *   {
 *     transversal: [AbstractLoggingTransversal, LoggingTransversal],
 *     role: 'audit',
 *     methods: (name) => name.startsWith('delete')
 *   }
 * ]
 * ```
 */
export type TransversalInjection<T> = 
  | [Identifier<T>]
  | [Identifier<T>, Record<string, any>]
  | [Abstract<T>, Concrete<T>]
  | [Abstract<T>, Concrete<T>, Record<string, any>];
