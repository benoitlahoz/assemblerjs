import type { Concrete } from '@assemblerjs/core';
import type { AssemblerContext } from '@/features/assembler';
import { AspectManager } from './aspect-manager';
import type { JoinPoint, AdviceContext, Advice } from '../types';

/**
 * AspectWeaver handles the weaving of aspects onto target instances.
 * It creates Proxy wrappers to intercept method calls and apply advices.
 */
export class AspectWeaver {
  /**
   * Weaves aspects onto an instance.
   * Returns a Proxy if aspects apply, otherwise returns the original instance.
   * 
   * @param instance The instance to weave aspects onto
   * @param concrete The concrete class of the instance
   * @param context The assembler context
   * @returns The woven instance (may be a Proxy)
   */
  public static weave<T>(
    instance: T,
    concrete: Concrete<T>,
    context: AssemblerContext
  ): T {
    const aspectManager = AspectManager.getInstance(context);
    
    // Get ALL aspects from context that apply to this class based on pointcuts
    const applicableAspects = aspectManager.getAspectsForTarget(concrete);

    // No applicable aspects? Return instance as-is
    if (applicableAspects.length === 0) {
      return instance;
    }

    // Create a Proxy to intercept method calls
    return new Proxy(instance as any, {
      get(target, propertyKey, receiver) {
        const property = Reflect.get(target, propertyKey, receiver);

        // Only intercept methods (not properties)
        if (typeof property !== 'function') {
          return property;
        }

        // Return a wrapped function with advices
        return function (this: any, ...args: any[]) {
          const methodName = String(propertyKey);
          
          // Build the JoinPoint
          const joinPoint: JoinPoint = {
            target,
            methodName,
            args,
          };

          // Get applicable advices for this method
          const advices = aspectManager.getAdvicesForJoinPoint(
            joinPoint,
            applicableAspects
          );

          // Execute the advice chain
          return AspectWeaver.executeAdviceChain(
            advices,
            property,
            target,
            args,
            joinPoint
          );
        };
      },
    }) as T;
  }

  /**
   * Executes the advice chain (before -> around -> method -> after).
   * Handles both synchronous and asynchronous execution.
   * 
   * @param advices The advices to execute
   * @param originalMethod The original method to call
   * @param target The target instance
   * @param args The method arguments
   * @param joinPoint The join point information
   * @returns The method result (may be a Promise)
   */
  private static executeAdviceChain(
    advices: Advice[],
    originalMethod: Function,
    target: any,
    args: any[],
    joinPoint: JoinPoint
  ): any {
    const beforeAdvices = advices.filter(a => a.type === 'before');
    const aroundAdvices = advices.filter(a => a.type === 'around');
    const afterAdvices = advices.filter(a => a.type === 'after');

    try {
      // 1. Execute @Before advices
      for (const advice of beforeAdvices) {
        const context: AdviceContext = { ...joinPoint };
        advice.method.call(advice.aspectInstance, context);
      }

      // 2. Execute @Around advices or the original method
      let result: any;
      if (aroundAdvices.length > 0) {
        // Build the proceed chain for around advices
        result = this.buildAroundChain(aroundAdvices, originalMethod, target, args, joinPoint);
      } else {
        // No around advice, execute method directly
        result = originalMethod.apply(target, args);
      }

      // 3. Handle Promise results
      if (result instanceof Promise) {
        return result.then(resolved => {
          // Execute @After advices
          for (const advice of afterAdvices) {
            const context: AdviceContext = { ...joinPoint, result: resolved };
            advice.method.call(advice.aspectInstance, context);
          }
          return resolved;
        }).catch(error => {
          // Update joinPoint with error and re-throw
          joinPoint.error = error;
          throw error;
        });
      }

      // 4. Execute @After advices (synchronous)
      for (const advice of afterAdvices) {
        const context: AdviceContext = { ...joinPoint, result };
        advice.method.call(advice.aspectInstance, context);
      }

      return result;
    } catch (error) {
      // Propagate error with context
      joinPoint.error = error;
      throw error;
    }
  }

  /**
   * Builds the proceed chain for around advices.
   * Each advice can call proceed() to continue to the next advice or the original method.
   * 
   * @param aroundAdvices The around advices to chain
   * @param originalMethod The original method
   * @param target The target instance
   * @param args The method arguments
   * @param joinPoint The join point information
   * @returns The result of the advice chain
   */
  private static buildAroundChain(
    aroundAdvices: Advice[],
    originalMethod: Function,
    target: any,
    args: any[],
    joinPoint: JoinPoint
  ): any {
    let index = 0;

    const proceed = (): any => {
      if (index < aroundAdvices.length) {
        const advice = aroundAdvices[index++];
        const context: AdviceContext = {
          ...joinPoint,
          proceed,
        };
        return advice.method.call(advice.aspectInstance, context);
      } else {
        // End of chain, execute the original method
        return originalMethod.apply(target, args);
      }
    };

    return proceed();
  }
}
