import type { Identifier } from '@/types';
import type { Injection } from '@/core/injection.types';
import type { Injectable } from '@/core/injectable';
import { AbstractEventManager } from '@/events/event-manager.abstract';
import { AbstractAssemblage } from './assemblage.abstract';

export interface AssemblerContext {
  // Assembler bindings.

  has: AbstractAssembler['has'];
  require: AbstractAssembler['require'];
  tagged: AbstractAssembler['tagged'];

  // EventManager bindings.

  on: AbstractAssembler['on'];
  once: AbstractAssembler['once'];
  off: AbstractAssembler['off'];
  events: AbstractAssembler['channels'];
}

export interface AssemblerPrivateContext extends AssemblerContext {
  // Assembler bindings.

  register: AbstractAssembler['register'];
  use: AbstractAssembler['use'];
  prepareInit: AbstractAssembler['prepareInit'];
  dispose: AssemblerDispose;

  // EventManager bindings.

  emit: AbstractAssembler['emit'];
  addChannels: AbstractAssembler['addChannels'];
  removeChannels: AbstractAssembler['removeChannels'];
}

export type AssemblerDispose = AbstractAssembler['dispose'];

export abstract class AbstractAssembler extends AbstractEventManager {
  public abstract privateContext: AssemblerContext;
  public abstract publicContext: AssemblerContext;
  public abstract size: number;

  public abstract register<T>(
    injection: Injection<T>,
    instance?: boolean
  ): Injectable<T>;
  public abstract use<T>(identifier: string | Symbol, object: T): T;
  public abstract prepareInit<T = AbstractAssemblage>(instance: T): unknown[];
  public abstract has<T>(identifier: Identifier<T>): boolean;
  public abstract require<T>(identifier: Identifier<T>): T;
  public abstract tagged(...tags: string[]): any[];

  public abstract dispose(): void;
}
