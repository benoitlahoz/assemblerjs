import type { Concrete } from '@assemblerjs/core';
import { clearInstance } from '@assemblerjs/core';
import type { Identifier } from '@/shared/common';
import {
  AbstractAssemblage,
  type Injection,
} from '@/features/assemblage';
import { Injectable } from '@/features/injectable';
import { EventManager } from '@/features/events';
import { AbstractAssembler } from '../model/types';

import type { AssemblerContext, AssemblerPrivateContext } from '../model/types';
import { InjectableManager } from './injectable-manager';
import { ObjectManager } from './object-manager';
import { HookManager } from './hook-manager';
import { AssemblerBuilder } from './assembler-builder';
import { ContextProvider } from './context-provider';
/**
 * `assembler.js` dependency injection container and handler.
 */
export class Assembler extends EventManager implements AbstractAssembler {
  /**
   * Build the dependencies tree from an assemblage as entry point.
   *
   * @param { Concrete<T> } entry An assemblage concrete class.
   * @param { Record<string, any> } configuration Optional configuration to pass to the build process.
   * @returns { T } An instance of `entry` marked as singleton.
   */
  public static build<T>(entry: Concrete<T>, configuration?: Record<string, any>): T {
    const assembler = new Assembler();
    const builder = new AssemblerBuilder(assembler);
    return builder.build(entry, configuration);
  }

  protected injectableManager: InjectableManager;
  protected objectManager: ObjectManager;
  protected _hookManager: HookManager;

  public get hookManager(): HookManager {
    return this._hookManager;
  }

  /**
   * Context passed to internal classes.
   */
  public readonly privateContext: AssemblerPrivateContext;

  /**
   * Context passed to assemblages.
   */
  public readonly publicContext: AssemblerContext;

  private constructor() {
    super();

    // Initialize managers
    this.injectableManager = new InjectableManager();
    this.objectManager = new ObjectManager();
    this._hookManager = new HookManager();

    // Initialize context provider
    const contextProvider = new ContextProvider(this);

    // Create contexts.
    this.publicContext = contextProvider.createPublicContext();
    this.privateContext = contextProvider.createPrivateContext(this.publicContext);

    // Set contexts in managers
    this.injectableManager.setContexts(this.privateContext, this.publicContext);
  }

  public override dispose(): void {
    this.injectableManager.dispose();
    clearInstance(this, Assembler as any);
  }

  public register<T>(injection: Injection<T>, instance = false): Injectable<T> {
    return this.injectableManager.register(injection, instance);
  }

  public use<T>(identifier: string | symbol, object: T): T {
    return this.objectManager.use(identifier, object);
  }

  public prepareInitHook<T = AbstractAssemblage>(
    instance: T,
    configuration?: Record<string, any>
  ): unknown[] {
    return this.hookManager.prepareInitHook(instance, configuration);
  }

  public has<T>(identifier: Identifier<T> | string | symbol): boolean {
    if (typeof identifier === 'string' || typeof identifier === 'symbol') {
      return this.objectManager.has(identifier);
    }
    return this.injectableManager.has(identifier as Identifier<T>);
  }

  public require<T>(
    identifier: Identifier<T> | string | symbol,
    configuration?: Record<string, any>
  ): T {
    switch (typeof identifier) {
      case 'string':
      case 'symbol': {
        return this.objectManager.require(identifier);
      }

      default: {
        return this.injectableManager.require(identifier as Identifier<T>, configuration);
      }
    }
  }

  public concrete<T>(identifier: Identifier<T>): Concrete<T> | undefined {
    return this.injectableManager.concrete(identifier);
  }

  public tagged(...tags: string[]): unknown[] {
    return this.injectableManager.tagged(...tags);
  }

  public addGlobal(key: string, value: any): void {
    this.objectManager.addGlobal(key, value);
  }

  /**
   * Get a global value by key.
   *
   * @param { string } key The key to get global value.
   * @returns { any | undefined } The global value or `undefined` if not set.
   */
  public global(key: string): any | undefined {
    return this.objectManager.global(key);
  }

  /**
   * Size of the assembler: number of registered dependencies.
   */
  public get size(): number {
    return this.injectableManager.size;
  }
}
