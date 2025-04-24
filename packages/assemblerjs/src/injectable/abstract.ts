import type { Concrete } from '@assemblerjs/core';
import type { Identifier } from '@/common';
import type {
  AssemblageDefinition,
  Buildable,
  Injection,
  InstanceInjection,
} from '@/assemblage';
import type {
  AssemblerContext,
  AssemblerPrivateContext,
} from '@/assembler/types';

export abstract class AbstractInjectable<T> {
  public static of<TNew>(
    // eslint-disable-next-line
    buildable: Buildable<TNew>,
    // eslint-disable-next-line
    privateContext: AssemblerPrivateContext,
    // eslint-disable-next-line
    publicContext: AssemblerContext
    // eslint-disable-next-line
  ) {}

  public abstract readonly privateContext: AssemblerPrivateContext;
  public abstract readonly publicContext: AssemblerContext;
  public abstract readonly identifier: Identifier<T> | string | symbol;
  public abstract readonly concrete: Concrete<T>;
  public abstract readonly configuration: Record<string, any>;
  public abstract dependencies: (Identifier<unknown> | any)[];
  public abstract definition: AssemblageDefinition;
  public abstract isSingleton: boolean;
  public abstract singleton: T | undefined;
  public abstract injections: Injection<unknown>[];
  public abstract objects: InstanceInjection<unknown>[];
  public abstract tags: string[];
  public abstract events: string[];

  public abstract dispose(): void;
  public abstract build(): T;
}
