import type { Injection } from './inject';
import type { InstanceInjection } from './use';
import type { AspectInjection } from './aspects';

/**
 * Assemblage definition interface.
 * Defines the configuration options for the @Assemblage decorator.
 */
export interface AssemblageDefinition {
  singleton?: boolean;
  events?: string[];
  inject?: Injection<unknown>[];
  use?: InstanceInjection<unknown>[];
  aspects?: AspectInjection<unknown>[];
  tags?: string | string[];
  metadata?: Record<string, any>;
  // Other packages can add global properties to the definition.
  global?: Record<string, any>;
}
