import type { Concrete, Identifier } from '@/types';
import {
  ReflectConfigurationParamIndex,
  ReflectContextParamIndex,
  ReflectIsSingletonFlag,
  ReflectMetadataParamIndex,
  ReflectParamTypes,
} from '@/common/constants';
import { getCustomMetadata, getOwnCustomMetadata } from '@/common/reflection';
import { AssemblerContext } from '@/assembler/context';
import { Injection } from './types';
import { resolveInjectionTuple } from './resolvers';

export class Injectable<T> {
  public readonly identifier: Identifier<T>;
  public readonly concrete: Concrete<T>;
  public readonly configuration: Record<string, any>;
  public singleton: T | undefined;

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
    const buildable = resolveInjectionTuple<T>(injection);

    this.identifier = buildable.identifier;
    this.concrete = buildable.concrete;
    this.configuration = buildable.configuration;

    // Register injectable assemblage's own injections (i.e. passed in the assemblage's definition).
    for (const injection of this.injections) {
      this.context.register(injection);
    }
  }

  /**
   * Instantiate the assemblage or get its singleton instance.
   *
   * @param { ...any[] } args The arguments to be passed to asssemblage's constructor.
   * @returns { T } The assemblage instance.
   */
  public build(): T {
    if (this.singleton) return this.singleton;

    const params = this.resolveDependencies();
    const instance = new this.concrete(...params) as T;

    if (this.isSingleton) {
      this.singleton = instance;
    }
    return instance;
  }

  /**
   * Resolve dependencies passed as parameters in constructor.
   *
   * @returns { (Identifier<unknown> | any)[] } An array of parameters.
   */
  private resolveDependencies(): (Identifier<unknown> | any)[] {
    const parameters: any[] = [];

    // Get parameters decorated with `@Context`, `@Configuration`.
    const contextParamIndex: number[] =
      getOwnCustomMetadata(ReflectContextParamIndex, this.concrete) || [];
    const configParamIndex: number[] =
      getOwnCustomMetadata(ReflectConfigurationParamIndex, this.concrete) || [];

    // Get metadata, including from parent class.
    const metadataParamIndex: number[] =
      getCustomMetadata(ReflectMetadataParamIndex, this.concrete) || [];

    // Build parameters to pass to constructor.
    let i = 0;
    for (const dependency of this.dependencies) {
      if (contextParamIndex.includes(i)) {
        parameters.push(this.context);
        i++;
        continue;
      }

      if (configParamIndex.includes(i)) {
        parameters.push(this.configuration);
        i++;
        continue;
      }

      if (metadataParamIndex.includes(i)) {
        parameters.push(this.metadata);
        i++;
        continue;
      }

      // Recursively require dependency to pass an instance to constructor.
      parameters.push(this.context.require(dependency));

      i++;
    }

    return parameters;
  }

  /**
   * `true` if assemblage is a singleton.
   *
   * @todo Change assembler to avoid checking instance.
   */
  public get isSingleton(): boolean {
    return getOwnCustomMetadata(ReflectIsSingletonFlag, this.concrete) || false;
  }

  /**
   * Injectable assemblage's own injections defined in its decorator's definition.
   */
  public get injections(): Injection<unknown>[] {
    return getOwnCustomMetadata('inject', this.concrete) || [];
  }

  /**
   * Injectable assemblage's dependencies passed as 'constructor' parameters.
   */
  public get dependencies(): (Identifier<unknown> | any)[] {
    return Reflect.getMetadata(ReflectParamTypes, this.concrete) || [];
  }

  public get metadata(): Record<string, any> {
    return getCustomMetadata('metadata', this.concrete) || {};
  }
}
