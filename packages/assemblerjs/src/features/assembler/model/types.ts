import type { Concrete } from '@assemblerjs/core';
import type { Identifier } from '@/shared/common';
import type { Injection } from '@/features/assemblage';
import { AbstractAssemblage } from '@/features/assemblage';
import type { Injectable } from '@/features/injectable';
import { AbstractEventManager } from '@/features/events';

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
  global: AbstractAssembler['global'];
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
  addGlobal: AbstractAssembler['addGlobal'];

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
export interface InjectableResolver {
  has<T>(identifier: Identifier<T>): boolean;
  require<T>(
    identifier: Identifier<T> | string | symbol,
    configuration?: Record<string, any>
  ): T;
  concrete<T>(identifier: Identifier<T>): Concrete<T> | undefined;
}

export interface ObjectProvider {
  use<T>(identifier: string | symbol, object: T): T;
  global(key: string): any | undefined;
  addGlobal(key: string, value: any): void;
}

export interface TagResolver {
  tagged(...tags: string[]): any[];
}

export interface LifecycleManager {
  prepareInitHook<T = AbstractAssemblage>(
    instance: T,
    configuration?: Record<string, any>
  ): unknown[];
}

export interface InjectableRegistrar {
  register<T>(injection: Injection<T>, instance?: boolean): Injectable<T>;
}

export interface ResolutionStrategy<T = any> {
  resolve(injectable: Injectable<T>, configuration?: Record<string, any>): T;
}

/**
 * Debug options for Assembler build process
 */
export interface AssemblerDebugOptions {
  enabled?: boolean;
  logger?: (level: 'info' | 'warn' | 'error', message: string, data?: any) => void;
  logPhases?: {
    registration?: boolean;
    registrationUse?: boolean;
    registrationGlobals?: boolean;
    resolution?: boolean;
    construction?: boolean;
    hooks?: boolean;
    cache?: boolean;
    injectionUse?: boolean;
    injectionGlobal?: boolean;
  };
  logTimings?: boolean;
  logDependencyTree?: boolean;
  useColors?: boolean;
  detectCycles?: boolean;
}

export abstract class AbstractAssembler
  extends AbstractEventManager
  implements
    InjectableResolver,
    ObjectProvider,
    TagResolver,
    LifecycleManager,
    InjectableRegistrar
{
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
  public abstract addGlobal(key: string, value: any): void;
  public abstract has<T>(identifier: Identifier<T>): boolean;
  public abstract require<T>(
    identifier: Identifier<T> | string | symbol,
    configuration?: Record<string, any>,
    caller?: Identifier<any>
  ): T;
  public abstract concrete<T>(
    identifier: Identifier<T>
  ): Concrete<T> | undefined;
  public abstract tagged(...tags: string[]): any[];
  public abstract global(key: string): any | undefined;
  public abstract override dispose(): void;
}
