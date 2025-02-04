import type { Concrete, Identifier } from '@/common';
import type { AssemblageDefinition } from '@/assemblage';

import type {
  AssemblerContext,
  AssemblerPrivateContext,
} from '@/assembler/types';
import type { Buildable, Injection, InstanceInjection } from '@/assemblage';

export abstract class AbstractInjectable<T> {
  public abstract readonly privateContext: AssemblerPrivateContext;
  public abstract readonly publicContext: AssemblerContext;
  public abstract readonly identifier: Identifier<T> | string | Symbol;
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

  public static of<TNew>(
    // @ts-ignore Will be set in implementation.
    buildable: Buildable<TNew>,
    // @ts-ignore Will be set in implementation.
    privateContext: AssemblerPrivateContext,
    // @ts-ignore Will be set in implementation.
    publicContext: AssemblerContext
  ) {}

  public abstract dispose(): void;
  public abstract build(): T;
}
