import type { Injection } from './inject';
import type { InstanceInjection } from './use';

export interface AssemblageDefinition {
  singleton?: false;
  events?: string[];
  inject?: Injection<unknown>[];
  use?: InstanceInjection<unknown>[];
  tags?: string | string[];
  metadata?: Record<string, any>;
}
