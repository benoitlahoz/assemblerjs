import type { AssemblerContext } from '@/features/assembler';

/**
 * Base abstract class to implement an aspect.
 * An aspect is a special kind of assemblage that provides cross-cutting concerns.
 * 
 * @example
 * ```typescript
 * @Aspect()
 * class LoggingAspect extends AbstractAspect {
 *   onInit() {
 *     console.log('Aspect initialized');
 *   }
 * 
 *   @Before('execution(UserService.*)')
 *   logBefore(context: AdviceContext) {
 *     console.log('Before:', context.methodName);
 *   }
 * }
 * ```
 */
export abstract class AbstractAspect {
  [key: string]: any;

  /**
   * Called on aspect class registration by assembler.
   * This is called when the aspect is registered, not when it is instantiated.
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
   * Called on aspect instantiation in less dependent to more dependent order 
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
   * Called when aspect instance is disposed.
   *
   * @param context The assembler's context.
   * @param configuration The configuration object.
   */
  public abstract onDispose?(
    context: AssemblerContext,
    configuration?: Record<string, any>
  ): void;

  /**
   * Dispose the aspect instance.
   * Called to clean up resources when the aspect is no longer needed.
   */
  public abstract dispose?(): void;

  /**
   * When decorated with '@Waitable', waits for a specific property to be truthy before resolving.
   * This can be used to ensure the aspect is fully initialized before use.
   */
  public abstract whenReady?(): Promise<void>;
}
