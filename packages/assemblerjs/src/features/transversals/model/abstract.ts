import type { AssemblerContext } from '@/features/assembler';

/**
 * Base abstract class to implement an transversal.
 * A transversal is a special kind of assemblage that provides cross-cutting concerns.
 * 
 * @example
 * ```typescript
 * @Transversal()
 * class LoggingTransversal extends AbstractTransversal {
 *   onInit() {
 *     console.log('Transversal initialized');
 *   }
 * 
 *   @Before('execution(UserService.*)')
 *   logBefore(context: AdviceContext) {
 *     console.log('Before:', context.methodName);
 *   }
 * }
 * ```
 */
export abstract class AbstractTransversal {
  [key: string]: any;

  /**
   * Called on transversal class registration by assembler.
   * This is called when the transversal is registered, not when it is instantiated.
   *
   * @param context The assembler's context.
   * @param configuration The configuration object.
   */
  public static onRegister(
    // eslint-disable-next-line
    context: AssemblerContext,
    // eslint-disable-next-line
    configuration?: Record<string, any>
    // eslint-disable-next-line
  ): void {}

  /**
   * Called on transversal instantiation in less dependent to more dependent order 
   * after the dependency tree is fully resolved.
   *
   * @param context The assembler's context.
   * @param configuration The configuration object.
   */
  public abstract onInit?(
    context: AssemblerContext,
    configuration?: Record<string, any>
  ): void | Promise<void>;

  /**
   * Called by the Assembler when all aspects have been initialized with onInit,
   * in more dependent to less dependent order (reverse of onInit).
   *
   * @param context The assembler's context.
   * @param configuration The configuration object.
   */
  public abstract onInited?(
    context: AssemblerContext,
    configuration?: Record<string, any>
  ): void | Promise<void>;

  /**
   * Called when transversal instance is disposed.
   *
   * @param context The assembler's context.
   * @param configuration The configuration object.
   */
  public abstract onDispose?(
    context: AssemblerContext,
    configuration?: Record<string, any>
  ): void;

  /**
   * Dispose the transversal instance.
   * Called to clean up resources when the transversal is no longer needed.
   */
  public abstract dispose?(): void;

  /**
   * When decorated with '@Waitable', waits for a specific property to be truthy before resolving.
   * This can be used to ensure the transversal is fully initialized before use.
   */
  public abstract whenReady?(): Promise<void>;
}
