import { Assemblage } from '@/features/assemblage';
import type { AssemblageDefinition } from '@/features/assemblage';
import { defineCustomMetadata, getCustomMetadata, ReflectValue } from '@/shared/common';
import { getDefinition } from '@/features/assemblage';

/**
 * Checks if a class is decorated with @Transversal
 * @param target The class to check
 * @returns True if the class is a transversal
 */
export function isTransversal(target: any): boolean {
  try {
    const definition = getDefinition(target);
    return definition?.metadata?.isTransversal === true;
  } catch {
    return false;
  }
}

/**
 * Decorator to define a class as an Transversal.
 * An Transversal is a specialized Assemblage that:
 * - Cannot have inject or use properties (must be empty)
 * - Receives dependencies through constructor parameters resolved from parent context
 * - Is singleton by default
 * - Cannot be combined with @Assemblage decorator
 * 
 * @param definition Optional assemblage definition (inject and use will be ignored)
 * @returns Class decorator
 * 
 * @example
 * ```typescript
 * @Transversal()
 * class LoggingTransversal extends AbstractTransversal {
 *   constructor(private logger: Logger) {
 *     super();
 *   }
 * 
 *   @Before('execution(UserService.*)')
 *   logBefore(context: AdviceContext) {
 *     this.logger.log('Before:', context.methodName);
 *   }
 * }
 * ```
 */
export function Transversal(definition?: Omit<AssemblageDefinition, 'inject' | 'use'>) {
  return function <T extends new (...args: any[]) => any>(target: T) {
    // Validate that definition doesn't have inject or use
    if (definition) {
      if ('inject' in definition || 'use' in definition) {
        throw new Error(
          `@Transversal on class ${target.name} cannot have inject or use properties. ` +
          `Aspects receive dependencies through constructor parameters resolved from parent context.`
        );
      }
    }

    // Get existing advices from method decorators (@Before, @After, @Around)
    const existingAdvices = getCustomMetadata(ReflectValue.TransversalAdvices, target) || [];

    // An Transversal is a specialized Assemblage (singleton by default, no inject/use)
    const aspectDefinition: AssemblageDefinition = {
      singleton: true,
      ...definition,
      // Explicitly ensure inject and use are empty
      inject: [],
      use: [],
      // Add metadata to identify this as an transversal and preserve advices
      metadata: {
        ...definition?.metadata,
        isTransversal: true,
        advices: existingAdvices,  // Include advices from method decorators
      },
    };

    // Decorate as Assemblage
    return Assemblage(aspectDefinition)(target);
  };
}

/**
 * Decorator to define a before advice.
 * The advice will be executed before the target method.
 * 
 * @param pointcut The pointcut expression (e.g., "execution(ClassName.methodName)")
 * @param priority Optional priority (higher values execute first, default: 0)
 * @returns Method decorator
 * 
 * @example
 * ```typescript
 * @Before('execution(UserService.save)', 100)
 * validateInput(context: AdviceContext) {
 *   // Validate before saving
 * }
 * ```
 */
export function Before(pointcut: string, priority = 0) {
  return function (
    target: any,
    propertyKey: string,
    _descriptor: PropertyDescriptor
  ) {
    addAdviceMetadata(target.constructor, {
      type: 'before',
      pointcut,
      methodName: propertyKey,
      priority,
      enabled: true,
    });
  };
}

/**
 * Decorator to define an after advice.
 * The advice will be executed after the target method completes.
 * The advice receives the method result in context.result.
 * 
 * @param pointcut The pointcut expression
 * @param priority Optional priority (higher values execute first, default: 0)
 * @returns Method decorator
 * 
 * @example
 * ```typescript
 * @After('execution(UserService.*)')
 * logAfter(context: AdviceContext) {
 *   console.log('Result:', context.result);
 * }
 * ```
 */
export function After(pointcut: string, priority = 0) {
  return function (
    target: any,
    propertyKey: string,
    _descriptor: PropertyDescriptor
  ) {
    addAdviceMetadata(target.constructor, {
      type: 'after',
      pointcut,
      methodName: propertyKey,
      priority,
      enabled: true,
    });
  };
}

/**
 * Decorator to define an around advice.
 * The advice wraps the target method and can control its execution.
 * Call context.proceed() to continue to the next advice or the original method.
 * 
 * @param pointcut The pointcut expression
 * @param priority Optional priority (higher values execute first, default: 0)
 * @returns Method decorator
 * 
 * @example
 * ```typescript
 * @Around('execution(UserService.save)')
 * async measureTime(context: AdviceContext) {
 *   const start = Date.now();
 *   const result = await context.proceed();
 *   console.log(`Took ${Date.now() - start}ms`);
 *   return result;
 * }
 * ```
 */
export function Around(pointcut: string, priority = 0) {
  return function (
    target: any,
    propertyKey: string,
    _descriptor: PropertyDescriptor
  ) {
    addAdviceMetadata(target.constructor, {
      type: 'around',
      pointcut,
      methodName: propertyKey,
      priority,
      enabled: true,
    });
  };
}

/**
 * Adds advice metadata to a transversal class.
 * Stores advices both in custom metadata and in definition.metadata for consistency.
 * 
 * @param target The transversal class
 * @param advice The advice metadata to add
 */
function addAdviceMetadata(target: any, advice: any): void {
  // Get existing advices
  const existing = getCustomMetadata(ReflectValue.TransversalAdvices, target) || [];
  existing.push(advice);
  defineCustomMetadata(ReflectValue.TransversalAdvices, existing, target);

  // Also store in definition.metadata for consistency with the assemblage system
  const definition = getCustomMetadata('assemblage:definition.value', target) || {};
  if (!definition.metadata) {
    definition.metadata = {};
  }
  definition.metadata.advices = existing;
  defineCustomMetadata('assemblage:definition.value', definition, target);
}
