import type { AssemblerContext } from '@/core/assembler.types';

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
  public static onRegister(context: AssemblerContext): void {}

  /**
   * Called on instantiated class after the dependency tree is fully resolved.
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

  /**
   * When decorated with '@Waitable', waits for a specific property to be truthy before resolving.
   */
  public abstract whenReady?(): Promise<void>;
}
