import type { Identifier } from '@/types';
import type { Injection } from '@/injection/types';
import { AssemblerContext } from './context';

export abstract class AbstractAssembler {
  public abstract context: AssemblerContext;
  public abstract register<T>(injection: Injection<T>): void;
  public abstract has<T>(identifier: Identifier<T>): boolean;
  public abstract require<T>(identifier: Identifier<T>): T;
}
