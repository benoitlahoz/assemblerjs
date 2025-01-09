import type { AssemblerContext } from '@/assembler/types';

/**
 * Base abstract class to implement an assemblage.
 */
export abstract class AbstractAssemblage {
  [key: string]: any;

  /**
   * Called on concrete class registration by assembler.
   *
   * @param { AssemblerContext } context The assembler's context.
   */
  // @ts-ignore 'context' is unused.
  static onRegister(context: AssemblerContext): void {}

  /**
   * Called when class is instantiated.
   *
   * @param { AssemblerContext } context The assembler's context.
   */
  public abstract onInit?(context: AssemblerContext): void | Promise<void>;

  /**
   * Called when instance of class is disposed.
   *
   * @param { AssemblerContext } context The assembler's context.
   */
  public abstract onDispose?(context: AssemblerContext): void;

  /**
   * Dispose the assemblage instance.
   */
  public abstract dispose?(): void;
}
