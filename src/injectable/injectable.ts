import type { Concrete, Identifier } from '@/common';
import { clearInstance, forOf } from '@/common';
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
import { resolveDependencies, resolveParameters } from './dependencies';
import { AbstractInjectable } from './abstract';

export class Injectable<T> implements AbstractInjectable<T> {
  public readonly identifier: Identifier<T> | string | Symbol;
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
        this.privateContext.register(injection as Injection<T>, true);
      }
    });

    // Cache dependencies.
    this.dependenciesIds = resolveDependencies(this.concrete);

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
      callHook(this.singletonInstance, 'onDispose', this.publicContext);
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

    const params = resolveParameters(this);
    const instance = new this.concrete(...params) as T;

    // Add event channels to eventual subclass of `EventManager` and forward to Assembler.
    registerEvents(this, instance);

    if (this.isSingleton) {
      this.singletonInstance = instance;
      this.privateContext.prepareInitHook(instance);
      return this.singletonInstance;
    }

    // Call hook for transient instances.
    callHook(instance, 'onInit', this.publicContext);

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
   * Event channels passed in assemblage's definition.
   */
  public get events(): string[] {
    return getDefinitionValue('events', this.concrete) || [];
  }
}
