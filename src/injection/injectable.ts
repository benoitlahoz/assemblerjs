import type { Concrete, Identifier } from '@/types';
import { clearInstance, forOf } from '@/common/utils';
import {
  AssemblageDefinition,
  getDefinition,
  getDefinitionValue,
} from '@/assemblage/definition';
import { callHook } from '@/assemblage/hooks';
import type { AssemblerContext } from '@/assembler/types';
import { EventManager } from '@/events/event-manager';
import type { Injection } from './types';
import { resolveInjectionTuple } from './injections';
import { resolveDependencies, resolveParameters } from './dependencies';

export class Injectable<T> {
  public readonly identifier: Identifier<T>;
  public readonly concrete: Concrete<T>;
  public readonly configuration: Record<string, any>;

  private dependenciesIds: Identifier<unknown>[] = [];
  private singletonInstance: T | undefined;

  public static of<TNew>(
    injection: Injection<TNew>,
    context: AssemblerContext
  ) {
    return new Injectable(injection, context);
  }

  private constructor(
    injection: Injection<T>,
    public readonly context: AssemblerContext
  ) {
    const buildable = resolveInjectionTuple(injection);

    this.identifier = buildable.identifier;
    this.concrete = buildable.concrete;
    this.configuration = buildable.configuration;

    // Register injectable assemblage's own injections (i.e. passed in the assemblage's definition).
    const iterateOwnInjections = forOf(this.injections);
    iterateOwnInjections(<U>(injection: Injection<U>) =>
      this.context.register(injection)
    );

    // Cache dependencies.
    this.dependenciesIds = resolveDependencies(this.concrete);

    if (this.isSingleton) {
      // Build now if singleton.
      this.build();
    }
  }

  /**
   * Dispose the injectable by deleting its singleton if exists.
   */
  public dispose(): void {
    if (this.singletonInstance) {
      // Call 'onDispose' hook.
      callHook(this.singletonInstance, 'onDispose', this.context);
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

    // Add event channels to subclass of `EventManager`.
    const isEventManager = this.concrete.prototype instanceof EventManager;
    if (isEventManager) {
      (instance as EventManager).addChannels(...this.events);
    }

    callHook(instance, 'onInit', this.context);

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
