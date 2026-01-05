import 'reflect-metadata';
import type { Identifier } from '@/shared/common';
import { ReflectValue } from '@/shared/common';

/**
 * Configuration for explicitly applying an aspect to a method.
 */
export interface AppliedAspectConfig {
  /** The aspect class to apply */
  aspect: Identifier<any>;
  /** Optional role to filter which advices from the aspect should apply */
  role?: string;
  /** Optional configuration for the aspect */
  config?: Record<string, any>;
}

/**
 * Method decorator to explicitly apply an aspect to a specific method.
 * This bypasses the automatic pointcut matching and forces the aspect on this method.
 * 
 * @example
 * ```typescript
 * @Assemblage()
 * class UserService {
 *   @ApplyAspect(LoggingAspect)
 *   create(data: any) { ... }
 *   
 *   @ApplyAspect(LoggingAspect, { role: 'audit' })
 *   @ApplyAspect(ValidationAspect)
 *   update(id: string, data: any) { ... }
 * }
 * ```
 */
export function ApplyAspect(
  aspect: Identifier<any>,
  options?: { role?: string; config?: Record<string, any> }
): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const config: AppliedAspectConfig = {
      aspect,
      role: options?.role,
      config: options?.config,
    };
    
    // Get existing applied aspects or initialize empty array
    const existingAspects: AppliedAspectConfig[] = 
      Reflect.getOwnMetadata(ReflectValue.AppliedAspects, target, propertyKey) || [];
    
    // Add this aspect to the list
    existingAspects.push(config);
    
    // Store back to metadata
    Reflect.defineMetadata(
      ReflectValue.AppliedAspects,
      existingAspects,
      target,
      propertyKey
    );
    
    return descriptor;
  };
}

/**
 * Gets the aspects explicitly applied to a method via @ApplyAspect decorator.
 * 
 * @param target The target object
 * @param methodName The method name
 * @returns Array of applied aspect configurations
 */
export function getAppliedAspects(
  target: any,
  methodName: string | symbol
): AppliedAspectConfig[] {
  return Reflect.getOwnMetadata(ReflectValue.AppliedAspects, target, methodName) || [];
}
