import type { Concrete } from '@assemblerjs/core';
import { clearInstance } from '@assemblerjs/core';
import { defineCustomMetadata, ReflectValue, type Identifier } from '@/shared/common';
import type {
  AssemblageDefinition,
  Buildable,
  Injection,
  InstanceInjection,
} from '@/features/assemblage';
import { isAssemblage, getDefinition } from '@/features/assemblage';
import type { AssemblerContext, AssemblerPrivateContext } from '@/features/assembler';
import { HookManager } from '@/features/assembler';
import { unregisterEvents } from '@/features/events';
import { InjectableBuilder } from './injectable-builder';
import type { AbstractInjectable } from '../model/abstract';
import {
  resolveDependencies,
} from './dependencies';

/**
 * Represents an injectable assemblage that can be built into instances.
 * Handles dependency resolution, configuration management, and lifecycle.
 */
export class Injectable<T> implements AbstractInjectable<T> {
  /** Unique identifier for this injectable. */
  public readonly identifier: Identifier<T> | string | symbol;
  /** The concrete class to instantiate. */
  public readonly concrete: Concrete<T>;
  /** Base configuration for this injectable. */
  public readonly configuration: Record<string, any>;
  /** Merged configuration used during build (base + runtime). */
  private mergedConfiguration?: Record<string, any>;
  /** Cached definition to avoid repeated metadata lookups. */
  private cachedDefinition?: AssemblageDefinition;
  /** Cached injections to avoid repeated definition access. */
  private cachedInjections?: Injection<unknown>[];
  /** Cached objects to avoid repeated definition access. */
  private cachedObjects?: InstanceInjection<unknown>[];
  /** Cached tags to avoid repeated definition access. */
  private cachedTags?: string | string[];
  /** Cached events to avoid repeated definition access. */
  private cachedEvents?: string[];
  /** Cached globals to avoid repeated definition access. */
  private cachedGlobals?: Record<string, any>;

  private dependenciesIds: Identifier<unknown>[] = [];
  protected singletonInstance: T | undefined;
  private builder: InjectableBuilder<T>;

  public static of<TNew>(
    buildable: Buildable<TNew>,
    privateContext: AssemblerPrivateContext,
    publicContext: AssemblerContext
  ) {
    return new Injectable(buildable, privateContext, publicContext);
  }

  private constructor(
    buildable: Buildable<T>,
    public readonly privateContext: AssemblerPrivateContext,
    public readonly publicContext: AssemblerContext
  ) {
    this.identifier = buildable.identifier;
    this.concrete = buildable.concrete;
    this.configuration = buildable.configuration;

    // Validate assemblage in development mode only
    if (process.env.NODE_ENV !== 'production' && !isAssemblage(this.concrete)) {
      throw new Error(`Class '${this.concrete.name}' is not an Assemblage.`);
    }

    this.builder = new InjectableBuilder(this);

    // Set context metadata for concrete assemblage.
    defineCustomMetadata(
      ReflectValue.AssemblageContext,
      this.publicContext,
      this.concrete
    );

    // Optimized: Use native for...of instead of forOf wrapper
    for (const injection of this.injections) {
      this.privateContext.register(injection);
    }

    for (const injection of this.objects) {
      if (typeof injection[0] === 'string' || typeof injection[0] === 'symbol') {
        this.privateContext.use(injection[0], injection[1]);
      } else {
        this.privateContext.register(injection as any, true);
      }
    }

    // Cache dependencies.
    this.dependenciesIds = resolveDependencies(this.concrete);

    // Cache globals.
    if (this.globals) {
      for (const key in this.globals) {
        this.privateContext.addGlobal(key, this.globals[key]);
      }
    }

    if (buildable.instance) {
      // Cache instance of the buildable if the dependency was registered with an object
      // through the `use` property of `AssemblerDefinition`.
      this.singletonInstance = buildable.instance;
    } 
  }

  /**
   * Dispose the injectable by deleting its singleton if exists
   * and deleting all injectable's properties.
   */
  public dispose(): void {
    if (this.singletonInstance) {
      unregisterEvents(this, this.singletonInstance);
      HookManager.callHook(
        this.singletonInstance,
        'onDispose',
        this.publicContext,
        this.mergedConfiguration || this.configuration
      );
      clearInstance(this.singletonInstance, this.concrete as any);
    }
    clearInstance(this, Injectable as any);
  }

  /**
   * Instantiate the assemblage.
   *
   * @param { Record<string, any> } [configuration] Optional configuration to pass to
   * the assemblage.
   * @returns { T } The assemblage instance.
   */
  public build(configuration?: Record<string, any>): T {
    return this.builder.build(configuration);
  }

  /**
   * Sets the singleton instance for this injectable.
   * Used internally by resolution strategies.
   * @param instance The singleton instance.
   * @param mergedConfiguration Optional merged configuration to store.
   */
  public setSingletonInstance(instance: T, mergedConfiguration?: Record<string, any>): void {
    this.singletonInstance = instance;
    if (mergedConfiguration) {
      this.mergedConfiguration = mergedConfiguration;
    }
  }

  /**
   * Metadatas passed in assemblage's definition or in its parent definition.
   * Cached to avoid repeated reflection calls.
   */
  public get definition(): AssemblageDefinition {
    if (!this.cachedDefinition) {
      this.cachedDefinition = getDefinition(this.concrete) || {};
    }
    return this.cachedDefinition;
  }

  /**
   * `true` if assemblage is a singleton.
   */
  public get isSingleton(): boolean {
    return this.definition.singleton ?? false;
  }

  /**
   * Injectable assemblage's dependencies passed as 'constructor' parameters.
   */
  public get dependencies(): (Identifier<unknown> | any)[] {
    return this.dependenciesIds;
  }

  /**
   * The singleton instance if this `Injectable` wraps a singleton assemblage.
   */
  public get singleton(): T | undefined {
    return this.singletonInstance;
  }

  /**
   * Injectable assemblage's own injections defined in its decorator's definition.
   */
  public get injections(): Injection<unknown>[] {
    if (this.cachedInjections === undefined) {
      this.cachedInjections = this.definition.inject || [];
    }
    return this.cachedInjections;
  }

  /**
   * Injectable assemblage's own objects (e.g. instances) injections defined in its decorator's definition.
   */
  public get objects(): InstanceInjection<unknown>[] {
    if (this.cachedObjects === undefined) {
      this.cachedObjects = this.definition.use || [];
    }
    return this.cachedObjects;
  }

  /**
   * Tags passed in assemblage's definition.
   */
  public get tags(): string[] {
    if (this.cachedTags === undefined) {
      this.cachedTags = this.definition.tags || [];
    }
    return Array.isArray(this.cachedTags) ? this.cachedTags : [this.cachedTags];
  }

  /**
   * Global injections passed in assemblage's definition.
   * These injections are available in all assemblages and can be used
   * to provide global values, services or utilities.
   */
  public get globals(): Record<string, any> | undefined {
    if (this.cachedGlobals === undefined) {
      this.cachedGlobals = this.definition.global;
    }
    return this.cachedGlobals;
  }

  /**
   * Event channels passed in assemblage's definition.
   */
  public get events(): string[] {
    if (this.cachedEvents === undefined) {
      this.cachedEvents = this.definition.events || [];
    }
    return this.cachedEvents;
  }
}
