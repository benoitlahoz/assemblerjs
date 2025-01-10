import type { Concrete, Identifier } from '@/types';
import { clearInstance, forOf } from '@/utils';
import { isAssemblage } from '@/core/assemblage.decorator';
import {
  AssemblageDefinition,
  getDefinition,
  getDefinitionValue,
} from '@/core/assemblage.definition';
import { callHook } from '@/core/assemblage.hooks';
import type {
  AssemblerContext,
  AssemblerPrivateContext,
} from '@/core/assembler.types';
import type { Buildable, Injection } from './injection.types';
import { resolveDependencies, resolveParameters } from './dependencies.helpers';
import { registerEvents, unregisterEvents } from './events.helpers';

export class Injectable<T> {
  public readonly identifier: Identifier<T>;
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

    // Register injectable assemblage's own injections (i.e. passed in the assemblage's definition).
    const iterateOwnInjections = forOf(this.injections);
    iterateOwnInjections(<U>(injection: Injection<U>) =>
      this.privateContext.register(injection)
    );

    // Cache dependencies.
    this.dependenciesIds = resolveDependencies(this.concrete);

    if (this.isSingleton) {
      // Build now if singleton.
      // this.build();
    }
  }

  /**
   * Dispose the injectable by deleting its singleton if exists
   * and deleting all injectable's properties.
   */
  public dispose(): void {
    if (this.singletonInstance) {
      // Unregister events on both the instance and the Assembler.
      unregisterEvents(this, this.singletonInstance);

      // Call 'onDispose' hook on singleton.
      callHook(this.singletonInstance, 'onDispose', this.publicContext);

      // Clear singleton.
      clearInstance(this.singletonInstance, this.concrete);
    }
    clearInstance(this, Injectable);
  }

  /**
   * Instantiate the assemblage or get its singleton instance.
   *
   * @returns { T } The assemblage instance.
   */
  public build(): T {
    if (this.singletonInstance) return this.singletonInstance;

    if (!isAssemblage(this.concrete)) {
      throw new Error(`Class '${this.concrete}' is not an Assemblage.`);
    }
    const params = resolveParameters(this);
    const instance = new this.concrete(...params) as T;

    // Add event channels to eventual subclass of `EventManager` and forward to Assembler.
    registerEvents(this, instance);

    callHook(instance, 'onInit', this.publicContext);

    if (this.isSingleton) {
      this.singletonInstance = instance;
    }

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
    return getDefinitionValue('singleton', this.concrete) || true;
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
   * Tags passed in assemblage's definition.
   */
  public get tags(): string[] {
    return getDefinitionValue('tags', this.concrete) || [];
  }

  /**
   * Event channels passed in assemblage's definition.
   */
  public get events(): string[] {
    return getDefinitionValue('events', this.concrete) || [];
  }
}
