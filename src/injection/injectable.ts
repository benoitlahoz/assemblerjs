import type { Concrete, Identifier } from '@/types';
import {
  AssemblageDefinition,
  getDefinitionValue,
} from '@/assemblage/definition';
import { callHook } from '@/assemblage/hooks';
import type { AssemblerContext } from '@/assembler/types';
import type { Injection } from './types';
import { resolveInjectionTuple } from './resolvers';
import { resolveDependencies, resolveParameters } from './dependencies';

export class Injectable<T> {
  public readonly identifier: Identifier<T>;
  public readonly concrete: Concrete<T>;
  public readonly configuration: Record<string, any>;
  public singleton: T | undefined;

  private dependenciesIds: Identifier<unknown>[] = [];

  public static of<TNew>(
    injection: Injection<TNew>,
    context: AssemblerContext
  ) {
    return new Injectable(injection, context);
  }

  private constructor(
    injection: Injection<T>,
    private context: AssemblerContext
  ) {
    const buildable = resolveInjectionTuple(injection);

    this.identifier = buildable.identifier;
    this.concrete = buildable.concrete;
    this.configuration = buildable.configuration;

    // Register injectable assemblage's own injections (i.e. passed in the assemblage's definition).
    for (const injection of this.injections) {
      this.context.register(injection);
    }

    // Cache dependencies.
    this.dependenciesIds = resolveDependencies(this.concrete);

    // TODO: Here check circular.
  }

  /**
   * Dispose the injectable by deleting its singleton if exists.
   */
  public dispose(): void {
    const self = this as any;
    delete self.singleton;
  }

  /**
   * Instantiate the assemblage or get its singleton instance.
   *
   * @returns { T } The assemblage instance.
   */
  public build(): T {
    if (this.singleton) return this.singleton;

    const params = resolveParameters(
      this.concrete,
      this.context,
      this.definition,
      this.configuration
    );
    const instance = new this.concrete(...params) as T;

    callHook(instance, 'onInit', this.context);

    if (this.isSingleton) {
      this.singleton = instance;
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
    return getDefinitionValue('metadata', this.concrete) || {};
  }

  /**
   * `true` if assemblage is a singleton.
   */
  public get isSingleton(): boolean {
    return getDefinitionValue('singleton', this.concrete);
  }

  /**
   * Injectable assemblage's own injections defined in its decorator's definition.
   */
  public get injections(): Injection<unknown>[] {
    return getDefinitionValue('inject', this.concrete) || [];
  }

  /**
   * Tags passed in assemblage's definition or in its parent definition.
   */
  public get tags(): string[] {
    return getDefinitionValue('tags', this.concrete) || [];
  }
}
