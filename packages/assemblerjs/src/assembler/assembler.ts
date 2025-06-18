import type { Concrete } from '@assemblerjs/core';
import { clearInstance } from '@assemblerjs/core';
import type { Identifier } from '@/common';
import type { Injection, InstanceInjection } from '@/assemblage';
import {
  AbstractAssemblage,
  setDefinitionValue,
  resolveInjectionTuple,
  resolveInstanceInjectionTuple,
} from '@/assemblage';
import { Injectable } from '@/injectable';
import { EventManager } from '@/events';
import { AbstractAssembler } from './types';

import type { AssemblerContext, AssemblerPrivateContext } from './types';
import { callHook } from './hooks';
/**
 * `assembler.js` dependency injection container and handler.
 */
export class Assembler extends EventManager implements AbstractAssembler {
  /**
   * Build the dependencies tree from an assemblage as entry point.
   *
   * @param { Concrete<T> } entry An assemblage concrete class.
   * @returns { T } An instance of `entry` marked as singleton.
   */
  public static build<T>(entry: Concrete<T>): T {
    const assembler = new Assembler();

    // Entry assemblage is always a singleton.
    setDefinitionValue('singleton', true, entry);

    // Recursively register dependencies beginning from the entry concrete class.
    const injectable = assembler.register([entry]);

    // Instance of entry assemblage will build recursively every dependency.
    const instance = assembler.require(injectable.identifier);

    // Remove entry instance from cache.
    const root = assembler.initCache.find(
      (value: { instance: any; configuration?: Record<string, any> }) =>
        value.instance === instance
    );
    if (!root) {
      throw new Error('Root instance not found in assemblages cache.');
    }

    const index = assembler.initCache.indexOf(root);
    assembler.initCache.splice(index, 1);

    // Call onInit on every dependency of our entry point, from the less dependent to the more dependent.
    for (const assemblage of assembler.initCache) {
      callHook(
        assemblage.instance,
        'onInit',
        assembler.publicContext,
        assemblage.configuration
      );
    }

    // Call hook on entry assemblage.
    callHook(
      instance,
      'onInit',
      assembler.publicContext,
      injectable.configuration
    );

    // Call onInited on every dependency of our entry point, in reverse order.
    for (const assemblage of assembler.initCache.reverse()) {
      callHook(
        assemblage.instance,
        'onInited',
        assembler.publicContext,
        assemblage.configuration
      );
    }

    callHook(
      instance,
      'onInited',
      assembler.publicContext,
      injectable.configuration
    );

    // Clean up.
    assembler.initCache.length = 0;

    return instance as T;
  }

  protected injectables: Map<Identifier<unknown>, Injectable<unknown>> =
    new Map();
  protected objects: Map<string | symbol, unknown> = new Map();
  private initCache: { instance: any; configuration?: Record<string, any> }[] =
    [];

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

    // Create contexts.

    this.publicContext = {
      has: this.has.bind(this),
      require: this.require.bind(this),
      concrete: this.concrete.bind(this),
      tagged: this.tagged.bind(this),
      dispose: this.dispose.bind(this),
      on: this.on.bind(this),
      once: this.once.bind(this),
      off: this.off.bind(this),
      events: this.channels,
    };

    this.privateContext = {
      ...this.publicContext,
      register: this.register.bind(this),
      use: this.use.bind(this),
      prepareInitHook: this.prepareInitHook.bind(this),
      emit: this.emit.bind(this),
      addChannels: this.addChannels.bind(this),
      removeChannels: this.removeChannels.bind(this),
    };
  }

  /**
   * Dispose assembler and all its injectables.
   * Note that injectables' instances will be disposed only if
   * the are singletons.
   *
   * Transient instances must be disposed by the user.
   */
  public override dispose(): void {
    for (const [_, injectable] of this.injectables) {
      injectable.dispose();
    }
    clearInstance(this, Assembler as any);
  }

  /**
   * Recursively register an `Injection` tuple and its inner injected dependencies.
   *
   * @param { Injection<T> } injection The injection tuple to register.
   * @param { boolean | undefined } instance Set to `true` if the injection binds an instance
   * to an identifier (defaults to `false`).
   * @returns { Injectable<T> } An injectable of type `T`.
   */
  public register<T>(injection: Injection<T>, instance = false): Injectable<T> {
    const buildable =
      instance === true
        ? resolveInstanceInjectionTuple(injection as InstanceInjection<T>)
        : resolveInjectionTuple(injection);

    if (this.has(buildable.identifier)) {
      throw new Error(
        `An assemblage is already registered with identifier '${buildable.identifier.name}'.`
      );
    }

    // Recursively register injectable's own dependencies.
    const injectable = Injectable.of<T>(
      buildable as any,
      this.privateContext,
      this.publicContext
    );

    // Cache injectable.
    this.injectables.set(injectable.identifier as Identifier<T>, injectable);

    // Call 'onRegister' hook.
    callHook(
      injectable.concrete,
      'onRegister',
      this.publicContext,
      injectable.configuration
    );

    return injectable as Injectable<T>;
  }

  /**
   * Register a string or symbol identifier with an object.
   *
   * @param { string | symbol } identifier The identifier to register.
   * @param { T } object The object to use with the identifier.
   * @returns { T } The object.
   *
   * @example
   * ```typescript
   * import express from 'express';
   *
   * @Assemblage({
   *   use: [
   *     ['express', express]
   *   ]
   * });
   * class MyAssemblage implements AbstractAssemblage {
   *   constructor(@Use('express) private express) {
   *     // Use express.
   *   }
   * }
   * ```
   */
  public use<T>(identifier: string | symbol, object: T): T {
    if (this.has(identifier)) {
      throw new Error(
        `A value is already registered with identifier '${String(identifier)}'.`
      );
    }
    this.objects.set(identifier, object);
    return object;
  }

  /**
   * Cache an instance to be inited with `onInit` hook
   * when the dependency tree will be fully resolved.
   *
   * @param { T = AbstractAssemblage } instance The built instance.
   * @param { Record<string, any> | undefined } configuration The configuration object.
   * @returns { unknown[] } The instances to be inited as this point.
   */
  public prepareInitHook<T = AbstractAssemblage>(
    instance: T,
    configuration?: Record<string, any>
  ): unknown[] {
    this.initCache.push({
      instance,
      configuration,
    });
    return this.initCache;
  }

  /**
   * Check if `Assembler` has given identifier registered.
   *
   * @param { Identifier<T> | string | symbol } identifier An abstract or concrete class,
   * or a string or symbol as identifier.
   * @returns { boolean } `true` if dependency has been registered.
   */
  public has<T>(identifier: Identifier<T> | string | symbol): boolean {
    if (typeof identifier === 'string' || typeof identifier === 'symbol') {
      return this.objects.has(identifier);
    }
    return this.injectables.has(identifier as Identifier<T>);
  }

  /**
   * Get or instantiate an assemblage for given identifier.
   *
   * @param { Identifier<T> | string | symbol } identifier The identifier to get instance from.
   * @param { Record<string, any> | undefined } configuration Optional configuration
   * object to pass to a transient assemblage's constructor.
   * @returns { T } An instance of Concrete<T>.
   */
  public require<T>(
    identifier: Identifier<T> | string | symbol,
    configuration?: Record<string, any>
  ): T {
    switch (typeof identifier) {
      case 'string':
      case 'symbol': {
        if (!this.objects.has(identifier)) {
          throw new Error(
            `Injected object with identifier '${String(
              identifier
            )}' has not been registered.`
          );
        }
        return this.objects.get(identifier) as T;
      }

      default: {
        if (!this.injectables.has(identifier as Identifier<T>)) {
          throw new Error(
            `Class with identifier '${
              (identifier as Identifier<T>).name
            }' has not been registered or is a circular dependency.`
          );
        }

        const injectable = this.injectables.get(
          identifier as Identifier<T>
        )! as Injectable<T>;

        const built = injectable.build(configuration);

        return built;
      }
    }
  }

  /**
   * Return a `Concrete` class for given identifier.
   *
   * @param { Identifier<T> } identifier The dentifier to get concrete class from.
   * @returns { Concrete<T> | undefined } A concrete class or `undefinedù if injectable is not set.
   */
  public concrete<T>(identifier: Identifier<T>): Concrete<T> | undefined {
    const injectable = this.injectables.get(identifier as Identifier<T>);

    if (injectable) return injectable.concrete as Concrete<T>;

    return;
  }

  /**
   * Require dependencies by tag passed in assemblage's definition.
   *
   * @param { string[] } tags The tags to get dependencies.
   * @returns { unknown[] } An array of instances for the given tags. If registered
   * identifier is not marked as 'singleton', will resolve in a new instance.
   */
  public tagged(...tags: string[]): unknown[] {
    const res: any[] = [];
    for (const tag of tags) {
      for (const [_, injectable] of this.injectables) {
        if (injectable.tags.includes(tag)) res.push(injectable.build());
      }
    }
    return res;
  }

  /**
   * Size of the assembler: number of registered dependencies.
   */
  public get size(): number {
    return this.injectables.size;
  }
}
