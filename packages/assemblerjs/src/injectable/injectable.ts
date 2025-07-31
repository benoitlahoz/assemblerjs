import type { Concrete } from '@assemblerjs/core';
import { clearInstance, forOf } from '@assemblerjs/core';
import { defineCustomMetadata, ReflectValue, type Identifier } from '@/common';
import type {
  AssemblageDefinition,
  Buildable,
  Injection,
  InstanceInjection,
} from '@/assemblage';
import { isAssemblage, getDefinition, getDefinitionValue } from '@/assemblage';
import type { AssemblerContext, AssemblerPrivateContext } from '@/assembler';
import { callHook } from '@/assembler';
import { registerEvents, unregisterEvents } from '@/events';
import {
  resolveDependencies,
  resolveInjectableParameters,
} from './dependencies';
import { AbstractInjectable } from './abstract';

export class Injectable<T> implements AbstractInjectable<T> {
  public readonly identifier: Identifier<T> | string | symbol;
  public readonly concrete: Concrete<T>;
  public readonly configuration: Record<string, any>;

  private dependenciesIds: Identifier<unknown>[] = [];

  private singletonInstance: T | undefined;

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

    if (!isAssemblage(this.concrete)) {
      throw new Error(`Class '${this.concrete.name}' is not an Assemblage.`);
    }

    // Set context metadata for concrete assemblage.
    defineCustomMetadata(
      ReflectValue.AssemblageContext,
      this.publicContext,
      this.concrete
    );

    const iterateOwnInjections = forOf(this.injections);
    const iterateOwnUsedInjections = forOf(this.objects);

    // Register injectable assemblage's own injections passed in 'inject' definition property.
    iterateOwnInjections(<U>(injection: Injection<U>) =>
      this.privateContext.register(injection)
    );

    // Register assemblage's injected objects (e.g. instances) passed in 'use' definition property.
    iterateOwnUsedInjections(<U>(injection: InstanceInjection<U>) => {
      if (
        typeof injection[0] === 'string' ||
        typeof injection[0] === 'symbol'
      ) {
        this.privateContext.use(injection[0], injection[1]);
      } else {
        this.privateContext.register(injection as any, true);
      }
    });

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
    } else if (this.isSingleton) {
      // TODO: Find a way to follow the '@Use' dependencies when building now.
      // Build singleton instance at bootstrap.
      // this.singletonInstance = this.build();
    }
  }

  /**
   * Dispose the injectable by deleting its singleton if exists
   * and deleting all injectable's properties.
   */
  public dispose(): void {
    if (this.singletonInstance) {
      unregisterEvents(this, this.singletonInstance);
      callHook(
        this.singletonInstance,
        'onDispose',
        this.publicContext,
        this.configuration
      );
      clearInstance(this.singletonInstance, this.concrete as any);
    }
    clearInstance(this, Injectable as any);
  }

  /**
   * Instantiate the assemblage or get its singleton instance.
   *
   * @param { Record<string, any> } [configuration] Optional configuration to pass to
   * a transient assemblage.
   * If not provided, the global assemblage's configuration will be used.
   * If the assemblage is a singleton, this parameter will be ignored.
   * @returns { T } The assemblage instance.
   */
  public build(configuration?: Record<string, any>): T {
    if (this.singletonInstance) return this.singletonInstance;

    const params = resolveInjectableParameters(this);
    const instance = new this.concrete(...params) as T;

    // Add event channels to eventual subclass of `EventManager` and forward to Assembler.
    registerEvents(this, instance);

    if (this.isSingleton) {
      this.singletonInstance = instance;
      this.privateContext.prepareInitHook(instance, this.configuration);

      return this.singletonInstance;
    }

    let config = {};
    if (this.configuration) {
      config = this.configuration;
    }
    if (configuration) {
      config = { ...config, ...configuration };
    }

    // Call hook for transient instances.
    callHook(instance, 'onInit', this.publicContext, config);

    return instance;
  }

  /**
   * Injectable assemblage's dependencies passed as 'constructor' parameters.
   */
  public get dependencies(): (Identifier<unknown> | any)[] {
    return this.dependenciesIds;
  }

  /**
   * Metadatas passed in assemblage's definition or in its parent definition.
   */
  public get definition(): AssemblageDefinition {
    return getDefinition(this.concrete) || {};
  }

  /**
   * `true` if assemblage is a singleton.
   */
  public get isSingleton(): boolean {
    return getDefinitionValue('singleton', this.concrete);
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
    return getDefinitionValue('inject', this.concrete) || [];
  }

  /**
   * Injectable assemblage's own objects (e.g. instances) injections defined in its decorator's definition.
   */
  public get objects(): InstanceInjection<unknown>[] {
    return getDefinitionValue('use', this.concrete) || [];
  }

  /**
   * Tags passed in assemblage's definition.
   */
  public get tags(): string[] {
    return getDefinitionValue('tags', this.concrete) || [];
  }

  /**
   * Global injections passed in assemblage's definition.
   * These injections are available in all assemblages and can be used
   * to provide global services or utilities.
   */
  public get globals(): Record<string, any> | undefined {
    return getDefinitionValue('global', this.concrete);
  }

  /**
   * Event channels passed in assemblage's definition.
   */
  public get events(): string[] {
    return getDefinitionValue('events', this.concrete) || [];
  }
}
