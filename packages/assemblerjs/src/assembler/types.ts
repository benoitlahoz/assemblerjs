import type { Concrete, Identifier } from '@/common';
import type { Injection } from '@/assemblage';
import { AbstractAssemblage } from '@/assemblage';
import type { Injectable } from '@/injectable';
import { AbstractEventManager } from '@/events';

/**
 * Assembler public context that provide
 * access to some useful `Assembler` methods.
 */
export interface AssemblerContext {
  // Assembler bindings.

  has: AbstractAssembler['has'];
  require: AbstractAssembler['require'];
  concrete: AbstractAssembler['concrete'];
  tagged: AbstractAssembler['tagged'];
  dispose: AssemblerDispose;

  // EventManager bindings.

  on: AbstractAssembler['on'];
  once: AbstractAssembler['once'];
  off: AbstractAssembler['off'];
  events: AbstractAssembler['channels'];
}

/**
 * Assembler private context that provide
 * access to some `Assembler` methods
 * used internally.
 */
export interface AssemblerPrivateContext extends AssemblerContext {
  // Assembler bindings.

  register: AbstractAssembler['register'];
  use: AbstractAssembler['use'];
  prepareInitHook: AbstractAssembler['prepareInitHook'];

  // EventManager bindings.

  emit: AbstractAssembler['emit'];
  addChannels: AbstractAssembler['addChannels'];
  removeChannels: AbstractAssembler['removeChannels'];
}

/**
 * `Assembler` dispose method type.
 */
export type AssemblerDispose = AbstractAssembler['dispose'];

/**
 * `Assembler` abstraction.
 */
export abstract class AbstractAssembler extends AbstractEventManager {
  public abstract privateContext: AssemblerContext;
  public abstract publicContext: AssemblerContext;
  public abstract size: number;

  public abstract register<T>(
    injection: Injection<T>,
    instance?: boolean
  ): Injectable<T>;
  public abstract use<T>(identifier: string | symbol, object: T): T;
  public abstract prepareInitHook<T = AbstractAssemblage>(
    instance: T,
    configuration?: Record<string, any>
  ): unknown[];
  public abstract has<T>(identifier: Identifier<T>): boolean;
  public abstract require<T>(identifier: Identifier<T> | string | symbol): T;
  public abstract concrete<T>(
    identifier: Identifier<T>
  ): Concrete<T> | undefined;
  public abstract tagged(...tags: string[]): any[];
  public abstract override dispose(): void;
}
