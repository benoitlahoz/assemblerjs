import type { Identifier } from '@/types';
import type { Injection } from '@/injection/types';
import type { Injectable } from '@/injection/injectable';

export interface AssemblerContext {
  register: AbstractAssembler['register'];
  has: AbstractAssembler['has'];
  require: AbstractAssembler['require'];
  tagged: AbstractAssembler['tagged'];
}

export abstract class AbstractAssembler {
  public abstract context: AssemblerContext;
  public abstract size: number;

  public abstract register<T>(injection: Injection<T>): Injectable<T>;
  public abstract has<T>(identifier: Identifier<T>): boolean;
  public abstract require<T>(identifier: Identifier<T>): T;
  public abstract tagged(...tags: string[]): any[];

  public abstract dispose(): void;
}
