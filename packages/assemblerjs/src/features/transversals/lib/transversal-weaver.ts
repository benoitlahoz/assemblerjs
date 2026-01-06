import type { Concrete } from '@assemblerjs/core';
import type { AssemblerContext } from '@/features/assembler';
import { TransversalManager } from './transversal-manager';
import type { JoinPoint, AdviceContext, Advice } from '../types';
import { getAffectedMethods } from '../decorators/affect';

/**
 * TransversalWeaver handles the weaving of aspects onto target instances.
 * It creates Proxy wrappers to intercept method calls and apply advices.
 */
export class TransversalWeaver {
  /**
   * Weaves transversals onto an instance.
   * Returns a Proxy if transversals apply, otherwise returns the original instance.
   * 
   * @param instance The instance to weave transversals onto
   * @param concrete The concrete class of the instance
   * @param context The assembler context
   * @returns The woven instance (may be a Proxy)
   */
  public static weave<T>(
    instance: T,
    concrete: Concrete<T>,
    context: AssemblerContext,
  ): T {
    const transversalManager = TransversalManager.getInstance(context);
    
    // Get ALL aspects from context that apply to this class based on pointcuts
    const applicableAspects = transversalManager.getAspectsForTarget(concrete);

    // Check if any methods have @Affect decorators
    const prototype = Object.getPrototypeOf(instance);
    const hasAffectedMethods = Object.getOwnPropertyNames(prototype).some(key => {
      if (key === 'constructor' || typeof prototype[key] !== 'function') return false;
      const affectedMethods = getAffectedMethods(prototype, key);
      return affectedMethods.length > 0;
    });

    // No aspects at all? Return instance as-is
    if (applicableAspects.length === 0 && !hasAffectedMethods) {
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
          // Includes both:
          // 1. Aspects matched by pointcut regex (automatic)
          // 2. Aspects explicitly applied via @Affect decorator (manual)
          const advices = transversalManager.getAdvicesForJoinPoint(
            joinPoint,
            applicableAspects,
            target,
            propertyKey
          );

          // Execute the advice chain
          return TransversalWeaver.executeAdviceChain(
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
        advice.method.call(advice.transversalInstance, context);
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
            advice.method.call(advice.transversalInstance, context);
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
        advice.method.call(advice.transversalInstance, context);
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
        return advice.method.call(advice.transversalInstance, context);
      } else {
        // End of chain, execute the original method
        return originalMethod.apply(target, args);
      }
    };

    return proceed();
  }
}
