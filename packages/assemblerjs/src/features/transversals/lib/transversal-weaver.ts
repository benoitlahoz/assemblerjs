import type { Concrete } from '@assemblerjs/core';
import type { AssemblerContext } from '@/features/assembler';
import { TransversalManager } from './transversal-manager';
import type { JoinPoint, AdviceContext, Advice } from '../types';
import { getAffectedMethods } from '../decorators/affect';

/**
 * Metadata about a woven instance caller
 */
interface CallerMetadata {
  className: string;
  identifier?: string | symbol;
}

/**
 * TransversalWeaver handles the weaving of aspects onto target instances.
 * It creates Proxy wrappers to intercept method calls and apply advices.
 */
export class TransversalWeaver {
  /**
   * Registry mapping woven proxy instances to their caller metadata.
   * Uses WeakMap to allow garbage collection of instances.
   */
  private static callerRegistry = new WeakMap<object, CallerMetadata>();

  /**
   * Stack context for caller information.
   * Independent of Transversals - works even without any engaged aspects.
   * Allows tracking callers from external sources (Vue, Node, etc).
   */
  private static callerStack: CallerMetadata[] = [];

  /**
   * Register caller metadata for a woven instance.
   * This allows manual registration if needed beyond automatic weaving.
   * 
   * @param instance The woven instance
   * @param className The name of the calling class
   * @param identifier Optional identifier of the caller
   */
  public static registerCaller<T extends object>(
    instance: T,
    className: string,
    identifier?: string | symbol
  ): void {
    this.callerRegistry.set(instance, { className, identifier });
  }

  /**
   * Get the caller metadata for a woven instance.
   * 
   * @param instance The woven instance
   * @returns The caller metadata or undefined if not found
   */
  public static getCallerMetadata(instance: object): CallerMetadata | undefined {
    return this.callerRegistry.get(instance);
  }

  /**
   * Execute a function with caller context.
   * The caller info will be available in Transversal advices if present,
   * or accessible via getCurrentCaller() at any time.
   * 
   * Works with or without Transversals engaged.
   * 
   * @param caller The name of the calling component/class
   * @param identifier Optional identifier (class reference, symbol, etc)
   * @param fn The function to execute
   * @returns The result of the function (may be a Promise)
   * 
   * @example
   * ```typescript
   * // From Vue component
   * TransversalWeaver.withCaller('MyVueComponent', () => {
   *   await userService.save(data);
   * });
   * 
   * // From Node with identifier
   * TransversalWeaver.withCaller('UserService', UserService, () => {
   *   await dataService.process();
   * });
   * ```
   */
  public static withCaller<T>(
    caller: string,
    identifier?: string | symbol | (() => T | Promise<T>),
    fn?: () => T | Promise<T>
  ): T | Promise<T> {
    // Handle overloads: (caller, fn) or (caller, identifier, fn)
    if (typeof identifier === 'function') {
      fn = identifier;
      identifier = undefined;
    }

    const metadata: CallerMetadata = { className: caller, identifier };
    this.callerStack.push(metadata);

    const result = fn!();
    
    // Handle Promise: pop after it resolves
    if (result instanceof Promise) {
      return result.finally(() => this.callerStack.pop());
    }
    
    // For synchronous functions, pop immediately after execution
    this.callerStack.pop();
    return result;
  }

  /**
   * Wrap a function with caller context.
   * Returns a new function that will execute with the specified caller context.
   * Useful for creating wrapped functions that can be called multiple times.
   * 
   * @param caller The name of the calling component/class
   * @param identifier Optional identifier (class reference, symbol, etc)
   * @param fn The function to wrap
   * @returns A wrapped function that maintains caller context on each call
   * 
   * @example
   * ```typescript
   * // In Vue component
   * const mergeClasses = TransversalWeaver.wrapCaller(
   *   'LeafletMap',
   *   'LeafletMap.vue',
   *   (...args: any[]) => tailwind.mergeClasses(...args)
   * );
   * 
   * // Now each call maintains the caller context
   * mergeClasses('class1', 'class2'); // Advices see caller: LeafletMap
   * ```
   */
  public static wrapCaller<T extends (...args: any[]) => any>(
    caller: string,
    identifier?: string | symbol | T,
    fn?: T
  ): T {
    // Handle overloads: (caller, fn) or (caller, identifier, fn)
    if (typeof identifier === 'function') {
      fn = identifier;
      identifier = undefined;
    }

    const metadata: CallerMetadata = { className: caller, identifier };

    return ((...args: any[]) => {
      this.callerStack.push(metadata);
      
      try {
        const result = fn!(...args);
        
        // Handle Promise: pop after it resolves
        if (result instanceof Promise) {
          return result.finally(() => this.callerStack.pop());
        }
        
        // For synchronous functions, pop immediately
        this.callerStack.pop();
        return result;
      } catch (error) {
        // Pop on error as well
        this.callerStack.pop();
        throw error;
      }
    }) as T;
  }

  /**
   * Get the current caller metadata from the context stack.
   * Returns undefined if no caller context is active.
   * Works even if no Transversal is engaged.
   * 
   * @returns The current caller metadata or undefined
   * 
   * @example
   * ```typescript
   * TransversalWeaver.withCaller('MyComponent', () => {
   *   const caller = TransversalWeaver.getCurrentCaller();
   *   console.log(caller?.className); // 'MyComponent'
   * });
   * ```
   */
  public static getCurrentCaller(): CallerMetadata | undefined {
    return this.callerStack[this.callerStack.length - 1];
  }
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
      if (key === 'constructor') return false;
      const descriptor = Object.getOwnPropertyDescriptor(prototype, key);
      if (!descriptor) return false;
      // Check if it's a method (function) or getter
      const isFunction = descriptor.value && typeof descriptor.value === 'function';
      const isGetter = descriptor.get && typeof descriptor.get === 'function';
      if (!isFunction && !isGetter) return false;
      const affectedMethods = getAffectedMethods(prototype, key);
      return affectedMethods.length > 0;
    });

    // No aspects at all? Return instance as-is
    if (applicableAspects.length === 0 && !hasAffectedMethods) {
      return instance;
    }

    // Create a Proxy to intercept method calls
    const woven = new Proxy(instance as any, {
      get(target, propertyKey, receiver) {
        const property = Reflect.get(target, propertyKey, receiver);

        // Only intercept methods (not properties)
        if (typeof property !== 'function') {
          return property;
        }

        // Return a wrapped function with advices
        return function (this: any, ...args: any[]) {
          const methodName = String(propertyKey);
          
          // Get caller metadata: prioritize stack context (Vue/Node/external via wrapCaller/withCaller), 
          // then fallback to WeakMap (Assemblages calling each other)
          const callerMetadata = 
            TransversalWeaver.getCurrentCaller()
            ?? TransversalWeaver.callerRegistry.get(this);
          
          // Build the JoinPoint with caller information
          const joinPoint: JoinPoint = {
            target,
            methodName,
            args,
            caller: callerMetadata?.className,
            callerIdentifier: callerMetadata?.identifier,
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

    // Register the woven proxy instance with its caller metadata
    TransversalWeaver.callerRegistry.set(woven as any, {
      className: concrete.name,
      identifier: concrete.name,
    });

    return woven;
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
        const context: AdviceContext = { ...joinPoint, config: advice.config };
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
        const context: AdviceContext = { ...joinPoint, result, config: advice.config };
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
          config: advice.config,
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
