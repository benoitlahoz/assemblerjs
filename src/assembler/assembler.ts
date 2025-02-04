import type { Concrete, Identifier } from '@/common';
import { clearInstance } from '@/common';
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
    const index = assembler.initCache.indexOf(instance);
    assembler.initCache.splice(index, 1);

    for (const assemblage of assembler.initCache) {
      callHook(assemblage, 'onInit', assembler.publicContext);
    }

    // Call hook on entry assemblage.
    callHook(instance, 'onInit', assembler.publicContext);

    // Clean up.
    assembler.initCache.length = 0;

    return instance;
  }

  protected injectables: Map<Identifier<unknown>, Injectable<unknown>> =
    new Map();
  protected objects: Map<string | Symbol, unknown> = new Map();
  private initCache: unknown[] = [];

  /**
   * Context passed to internal classes.
   */
  public readonly privateContext: AssemblerPrivateContext;

  /**
   * Context passed to assemblages.
   */
  public readonly publicContext: AssemblerContext;

  private constructor() {
    // EventManager listens to all events ('*') by default.
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
  public dispose(): void {
    for (const [_, injectable] of this.injectables) {
      injectable.dispose();
    }
    clearInstance(this, Assembler);
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
      buildable,
      this.privateContext,
      this.publicContext
    );

    // Cache injectable.
    this.injectables.set(injectable.identifier as Identifier<T>, injectable);

    // Call 'onRegister' hook.
    callHook(injectable.concrete, 'onRegister', this.publicContext);

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
  public use<T>(identifier: string | Symbol, object: T): T {
    if (this.has(identifier)) {
      throw new Error(
        `A value is already registered with identifier '${String(identifier)}'.`
      );
    }
    this.objects.set(identifier, object);
    return object;
  }

  /**
   * Cache an instaance to be inited with `onInit` hook
   * when the dependency tree will be fully resolved.
   *
   * @param { T = AbstractAssemblage } instance The built instance.
   * @returns { unknown[] } The instances to be inited as this point.
   */
  public prepareInitHook<T = AbstractAssemblage>(instance: T): unknown[] {
    this.initCache.push(instance);
    return this.initCache;
  }

  /**
   * Check if `Assembler` has given identifier registered.
   *
   * @param { Identifier<T> | string | symbol } identifier An abstract or concrete class,
   * or a string or Symbol as identifier.
   * @returns { boolean } `true` if dependency has been registered.
   */
  public has<T>(identifier: Identifier<T> | string | Symbol): boolean {
    if (typeof identifier === 'string' || typeof identifier === 'symbol') {
      return this.objects.has(identifier);
    }
    return this.injectables.has(identifier as Identifier<T>);
  }

  /**
   * Get or instantiate an assemblage for given identifier.
   *
   * @param { Identifier<T> | string | symbol } identifier The identifier to get instance from.
   * @returns { T } An instance of Concrete<T>.
   */
  public require<T>(identifier: Identifier<T> | string | Symbol): T {
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
        return injectable.build();
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
