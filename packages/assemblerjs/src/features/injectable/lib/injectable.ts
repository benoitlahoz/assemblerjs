import type { Concrete } from '@assemblerjs/core';
import { clearInstance, isClass } from '@assemblerjs/core';
import { defineCustomMetadata, ReflectValue, type Identifier } from '@/shared/common';
import type {
  AssemblageDefinition,
  Buildable,
  Injection,
  InstanceInjection,
} from '@/features/assemblage';
import { isAssemblage, getDefinition } from '@/features/assemblage';
import { TransversalManager, isTransversal } from '@/features/transversals';
import type { AssemblerContext, AssemblerPrivateContext } from '@/features/assembler';
import { HookManager } from '@/features/assembler';
import { DebugLogger } from '@/features/assembler/lib/debug-logger';
import { unregisterEvents } from '@/features/events';
import { InjectableBuilder } from './injectable-builder';
import type { AbstractInjectable } from '../model/abstract';
import {
  resolveDependencies,
} from './dependencies';
import { isFactory } from '@/features/assemblage';

/**
 * Represents an injectable assemblage that can be built into instances.
 * Handles dependency resolution, configuration management, and lifecycle.
 */
export class Injectable<T> implements AbstractInjectable<T> {
  /** Unique identifier for this injectable. */
  public readonly identifier: Identifier<T> | string | symbol;
  /** The concrete class to instantiate. */
  public readonly concrete: Concrete<T> | undefined;
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
  /** Cached aspects to avoid repeated definition access. */
  private cachedTransversals?: any[];
  /** Cached tags to avoid repeated definition access. */
  private cachedTags?: string | string[];
  /** Cached events to avoid repeated definition access. */
  private cachedEvents?: string[];
  /** Cached globals to avoid repeated definition access. */
  private cachedGlobals?: Record<string, any>;

  private dependenciesIds: Identifier<unknown>[] = [];
  protected singletonInstance: T | undefined;
  private builder: InjectableBuilder<T>;
  public readonly factory?: () => T;

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
    (this as any).factory = buildable.factory;
    this.configuration = buildable.configuration;

    // Validate assemblage in development mode only
    if (process.env.NODE_ENV !== 'production' && this.concrete && !isAssemblage(this.concrete)) {
      throw new Error(`Class '${this.concrete.name}' is not an Assemblage.`);
    }

    this.builder = new InjectableBuilder(this);

    // Set context metadata for concrete assemblage.
    if (this.concrete) {
      const logger = DebugLogger.getInstance();
      defineCustomMetadata(
        ReflectValue.AssemblageContext,
        this.publicContext,
        this.concrete
      );

      // Cache globals early so @Global can resolve during injections.
      if (this.globals) {
        const globalKeys = Object.keys(this.globals);
        const globalValues = globalKeys.map((key) => {
          const value = (this.globals as any)[key];
          return { key, value };
        });
        if (globalKeys.length > 0) {
          logger.logPhaseStart('registrationGlobals', {
            target: this.concrete?.name ?? String(this.identifier),
            count: globalKeys.length,
            keys: globalKeys,
            values: globalValues,
          });
        }
        for (const key in this.globals) {
          this.privateContext.addGlobal(key, this.globals[key]);
        }
        if (globalKeys.length > 0) {
          logger.logPhaseEnd('registrationGlobals', undefined, {
            target: this.concrete?.name ?? String(this.identifier),
          });
        }
      }

      // CRITICAL: Multi-phase registration to ensure aspects are available during weaving
      
      // Phase 1: Register ALL transversals (from transversals[] and from inject[]) as injectables FIRST
      // This ensures they're available as dependencies but not yet in TransversalManager
      for (const transversal of this.transversals) {
        // Register the transversal injection (supports [Concrete], [Abstract, Concrete], etc.)
        const injection = this.resolveTransversalToInjection(transversal);
        this.privateContext.register(injection);
      }
      
      // Also check if any injection is an transversal and register it first
      for (const injection of this.injections) {
        const [ConcreteClass] = injection;
        if (isTransversal(ConcreteClass)) {
          this.privateContext.register(injection);
        }
      }

      // Phase 2: Register remaining (non-transversal) injections
      for (const injection of this.injections) {
        const [ConcreteClass] = injection;
        if (!isTransversal(ConcreteClass)) {
          this.privateContext.register(injection);
        }
      }

      if (this.objects.length > 0) {
        const useKeys = this.objects.map(([identifier]) => {
          if (typeof identifier === 'symbol') return identifier.toString();
          if (typeof identifier === 'function') return identifier.name || identifier.toString();
          return String(identifier);
        });
        const useValues = this.objects.map(([identifier, value]) => {
          const key = typeof identifier === 'symbol'
            ? identifier.toString()
            : typeof identifier === 'function'
              ? identifier.name || identifier.toString()
              : String(identifier);
          return { key, value };
        });
        logger.logPhaseStart('registrationUse', {
          target: this.concrete?.name ?? String(this.identifier),
          count: this.objects.length,
          keys: useKeys,
          values: useValues,
        });
      }

      for (const injection of this.objects) {
        const [identifier, value] = injection;
        const isUseFactory = isFactory(value);

        // Route string and symbol identifiers to the ObjectManager, not the InjectableManager.
        if (typeof identifier === 'string' || typeof identifier === 'symbol') {
          const instance = isUseFactory ? (value as () => unknown)() : value;
          this.privateContext.use(identifier, instance as any);
          continue;
        }

        // For singleton assemblages, execute factory once and register the produced instance.
        if (this.isSingleton && isUseFactory) {
          const instance = (value as () => unknown)();
          this.privateContext.register([identifier, instance] as any, true);
        } else {
          // Register through InjectableManager so factories are lazily executed when resolved.
          this.privateContext.register(injection as any, true);
        }
      }

      if (this.objects.length > 0) {
        logger.logPhaseEnd('registrationUse', undefined, {
          target: this.concrete?.name ?? String(this.identifier),
        });
      }

      // Phase 3: Now that all injections are registered, register transversals in TransversalManager
      const transversalManager = TransversalManager.getInstance(this.publicContext);
      
      for (const transversal of this.transversals) {
        transversalManager.registerTransversal(transversal, this.privateContext);
      }
      
      // Also register aspects that were in inject[]
      for (const injection of this.injections) {
        const [ConcreteClass] = injection;
        if (isTransversal(ConcreteClass)) {
          // Convert injection to transversal injection format
          const transversalInjection = injection.length > 1 ? injection : [ConcreteClass];
          transversalManager.registerTransversal(transversalInjection as any, this.privateContext);
        }
      }

      // Cache dependencies.
      this.dependenciesIds = this.concrete ? resolveDependencies(this.concrete) : [];

    }

    if (buildable.instance) {
      // Cache instance of the buildable if the dependency was registered with an object
      // through the `use` property of `AssemblerDefinition`.
      this.singletonInstance = buildable.instance;
    } else if (buildable.factory) {
      // For `use:` factories we execute once and cache the result.
      const instance = buildable.factory();
      this.singletonInstance = instance;
    }
  }

  /**
   * Converts an TransversalInjection to an Injection format for registration.
   * Supports all TransversalInjection formats:
   * - [Concrete]
   * - [Concrete, config]
   * - [Abstract, Concrete]
   * - [Abstract, Concrete, config]
   * 
   * @param transversal The transversal injection to convert
   * @returns An Injection that can be registered in the context
   */
  private resolveTransversalToInjection(transversal: any): Injection<any> {
    // Handle tuple format
    if (transversal.length === 1) {
      // [Concrete]
      return [transversal[0]];
    } else if (transversal.length === 2) {
      const second = transversal[1];
      if (isClass(second)) {
        // [Abstract, Concrete]
        return [transversal[0], transversal[1]];
      } else {
        // [Concrete, config]
        return [transversal[0], transversal[1]];
      }
    } else {
      // [Abstract, Concrete, config]
      return [transversal[0], transversal[1], transversal[2]];
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
      if (!this.concrete) {
        this.cachedDefinition = {};
      } else {
        this.cachedDefinition = getDefinition(this.concrete) || {};
      }
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
   * Injectable assemblage's transversals defined in its decorator's definition.
   */
  public get transversals(): any[] {
    if (this.cachedTransversals === undefined) {
      this.cachedTransversals = this.definition.engage || [];
    }
    return this.cachedTransversals;
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
