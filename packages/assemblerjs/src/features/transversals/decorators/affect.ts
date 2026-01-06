import 'reflect-metadata';
import type { Identifier } from '@/shared/common';
import { ReflectValue } from '@/shared/common';

/**
 * Configuration for explicitly applying an transversal to a method.
 */
export interface AffectedMethodConfig {
  /** The transversal class to apply */
  transversal: Identifier<any>;
  /** Optional role to filter which advices from the transversal should apply */
  role?: string;
  /** Optional configuration for the transversal */
  config?: Record<string, any>;
}

/**
 * Method decorator to explicitly apply a transversal to a specific method.
 * This bypasses the automatic pointcut matching and forces the transversal on this method.
 * 
 * @example
 * ```typescript
 * @Assemblage()
 * class UserService {
 *   @Affect(LoggingTransversal)
 *   create(data: any) { ... }
 *   
 *   @Affect(LoggingTransversal, { role: 'audit' })
 *   @Affect(ValidationTransversal)
 *   update(id: string, data: any) { ... }
 * }
 * ```
 */
export function Affect(
  transversal: Identifier<any>,
  config?: Record<string, any>,
): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const affectedConfig: AffectedMethodConfig = {
      transversal,
      config,
    };
    
    // Get existing affected methods or initialize empty array
    const existingAffectedMethods: AffectedMethodConfig[] = 
      Reflect.getOwnMetadata(ReflectValue.AffectedMethods, target, propertyKey) || [];
    
    // Add this transversal to the list
    existingAffectedMethods.push(affectedConfig);
    
    // Store back to metadata
    Reflect.defineMetadata(
      ReflectValue.AffectedMethods,
      existingAffectedMethods,
      target,
      propertyKey
    );
    
    return descriptor;
  };
}

/**
 * Gets the transversals explicitly applied to a method via @Affect decorator.
 * 
 * @param target The target object
 * @param methodName The method name
 * @returns Array of affected method configurations
 */
export function getAffectedMethods(
  target: any,
  methodName: string | symbol
): AffectedMethodConfig[] {
  return Reflect.getOwnMetadata(ReflectValue.AffectedMethods, target, methodName) || [];
}
