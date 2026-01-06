import type { Injection } from './inject';
import type { InstanceInjection } from './use';
import type { TransversalInjection } from './transversals';

/**
 * Assemblage definition interface.
 * Defines the configuration options for the @Assemblage decorator.
 */
export interface AssemblageDefinition {
  singleton?: boolean;
  events?: string[];
  inject?: Injection<unknown>[];
  use?: InstanceInjection<unknown>[];
  engage?: TransversalInjection<unknown>[];
  tags?: string | string[];
  metadata?: Record<string, any>;
  global?: Record<string, any>;
}
