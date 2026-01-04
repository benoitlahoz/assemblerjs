import type { AssemblerContext } from '@/features/assembler';

/**
 * Base abstract class to implement an assemblage.
 */
export abstract class AbstractAssemblage {
  [key: string]: any;

  /**
   * Called on concrete class registration by assembler.
   *
   * @param { AssemblerContext } context The assembler's context.
   * @param { Reord<string, any> } configuration The configuration object.
   */
  public static onRegister(
    // eslint-disable-next-line
    context: AssemblerContext,
    // eslint-disable-next-line
    configuration?: Record<string, any>
    // eslint-disable-next-line
  ): void {}

  /**
   * Called on instantiated class in less dependent to more dependent order after the dependency tree is fully resolved.
   *
   * @param { AssemblerContext } context The assembler's context.
   * @param { Reord<string, any> } configuration The configuration object.
   */
  public abstract onInit?(
    context: AssemblerContext,
    configuration?: Record<string, any>
  ): void | Promise<void>;

  /**
   * Called by the `Assembler` when all classes have been inited with `onInit`, including the entry point,
   * in more dependent to less dependent order.
   *
   * @param { AssemblerContext } context The assembler's context.
   * @param { Reord<string, any> } configuration The configuration object.
   */
  public abstract onInited?(
    context: AssemblerContext,
    configuration?: Record<string, any>
  ): void | Promise<void>;

  /**
   * Called when instance of class is disposed.
   *
   * @param { AssemblerContext } context The assembler's context.
   * @param { Record<string, any> } configuration The configuration object.
   */
  public abstract onDispose?(
    context: AssemblerContext,
    configuration?: Record<string, any>
  ): void;

  /**
   * Dispose the assemblage instance.
   */
  public abstract dispose?(): void;

  /**
   * When decorated with '@Waitable', waits for a specific property to be truthy before resolving.
   */
  public abstract whenReady?(): Promise<void>;
}
