import type { AssemblerContext } from '@/assembler/types';

/**
 * Base abstract class to implement an assemblage.
 */
export abstract class AbstractAssemblage {
  [key: string]: any;

  // @ts-expect-error 'context' is unused.
  static onRegister(context: AssemblerContext): void {}

  public abstract onInit?(context: AssemblerContext): void | Promise<void>;
  public abstract onDispose?(context: AssemblerContext): void;

  public abstract dispose?(): void;
}
