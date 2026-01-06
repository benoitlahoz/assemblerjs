import type { Concrete } from '@assemblerjs/core';
import { isClass } from '@assemblerjs/core';
import type { AssemblerContext } from '@/features/assembler';
import type { TransversalMetadata, Advice, JoinPoint } from '../types';
import { PointcutMatcher } from './pointcut-matcher';
import { getDefinition, TransversalInjection } from '@/features/assemblage';
import { getAffectedMethods } from '../decorators/affect';

/**
 * TransversalManager manages transversal registration and advice resolution.
 */
export class TransversalManager {
  private static instances = new WeakMap<AssemblerContext, TransversalManager>();
  
  // Global singleton transversal instances (shared across all contexts)
  private static transversalInstances = new Map<string, any>();
  
  // Global transversal metadata (shared across all contexts)
  private static transversalMetadata = new Map<string, TransversalMetadata>();

  private constructor(private context: AssemblerContext) {}

  /**
   * Gets or creates an TransversalManager instance for a given context.
   * 
   * @param context The assembler context
   * @returns The TransversalManager instance for this context
   */
  public static getInstance(context: AssemblerContext): TransversalManager {
    let instance = this.instances.get(context);
    if (!instance) {
      instance = new TransversalManager(context);
      this.instances.set(context, instance);
    }
    return instance;
  }

  /**
   * Gets the singleton transversal instance by class name.
   * CRITICAL: This ensures that aspects injected in constructors use the same instance as weaving.
   * 
   * @param transversalClassName The name of the transversal class
   * @returns The transversal instance or undefined if not registered
   */
  public getTransversalInstance(transversalClassName: string): any | undefined {
    return TransversalManager.transversalInstances.get(transversalClassName);
  }

  /**
   * Clears all global transversal instances and metadata.
   * Useful for testing to reset state between tests.
   * WARNING: This will clear ALL aspects globally across all contexts.
   */
  public static resetGlobalState(): void {
    TransversalManager.transversalInstances.clear();
    TransversalManager.transversalMetadata.clear();
    TransversalManager.instances = new WeakMap<AssemblerContext, TransversalManager>();
  }

  /**
   * Registers a transversal from its injection definition.
   * The transversal is resolved from the context and its advices are extracted.
   * 
   * - [TransversalClass] - Simple injection
   * - [TransversalClass, config] - With configuration
   * - [AbstractClass, ConcreteClass] - With abstraction
   * - [AbstractClass, ConcreteClass, config] - With abstraction and config
   * 
   * @param transversalInjection The transversal injection tuple or config object
   * @param resolveContext Optional context to use for resolving the transversal (if different from manager's context)
   * @param assemblageIdentifier Optional identifier for the assemblage context (for configuration tracking)
   */
  public registerTransversal(
    transversalInjection: TransversalInjection<any>,
    resolveContext?: AssemblerContext,
  ): void {
    let AbstractClass: any;
    let TransversalClass: any;
    let config: Record<string, any> | undefined;

      // Old array syntax (backward compatible)
      if (transversalInjection.length === 1) {
        // [TransversalClass]
        AbstractClass = transversalInjection[0];
        TransversalClass = transversalInjection[0];
        config = undefined;
      } else if (transversalInjection.length === 2) {
        const second = transversalInjection[1];
        if (isClass(second)) {
          // [AbstractClass, ConcreteClass]
          AbstractClass = transversalInjection[0];
          TransversalClass = second;
          config = undefined;
        } else {
          // [TransversalClass, config]
          AbstractClass = transversalInjection[0];
          TransversalClass = transversalInjection[0];
          config = second;
        }
      } else {
        // [AbstractClass, ConcreteClass, config]
        AbstractClass = transversalInjection[0];
        TransversalClass = transversalInjection[1] as any;
        config = transversalInjection[2];
      }
    
    const transversalClassName = TransversalClass.name;
    
    // Check if transversal is already instantiated globally
    if (!TransversalManager.transversalInstances.has(transversalClassName)) {
      // Resolve the transversal instance (singleton)
      const contextToUse = resolveContext || this.context;
      const transversalInstance = contextToUse.require(AbstractClass, config);
      const definition = getDefinition(TransversalClass as any);

      if (!definition) {
        throw new Error(`Transversal ${transversalClassName} must be decorated with @Transversal`);
      }

      // Store singleton instance globally
      TransversalManager.transversalInstances.set(transversalClassName, transversalInstance);
      
      // Store metadata globally
      const metadata: TransversalMetadata = {
        definition: definition as any,
        advices: this.extractAdvices(TransversalClass, transversalInstance),
        instance: transversalInstance,
      };
      TransversalManager.transversalMetadata.set(transversalClassName, metadata);
    }
  }

  /**
   * Extracts advices from a transversal class instance.
   * Advices are stored in definition.metadata.advices by the decorators.
   * Now also extracts role information from the pointcut.
   * 
   * @param TransversalClass The transversal class
   * @param transversalInstance The transversal instance
   * @returns Array of extracted advices
   */
  private extractAdvices(TransversalClass: any, transversalInstance: any): Advice[] {
    const definition = getDefinition(TransversalClass);
    const advices: Advice[] = [];

    // Advices are stored in definition.metadata.advices
    // (defined by @Before, @After, @Around decorators)
    const adviceMetadata = definition?.metadata?.advices || [];

    for (const advice of adviceMetadata) {
      const method = transversalInstance[advice.methodName];
      
      if (typeof method !== 'function') {
        throw new Error(
          `Advice method ${advice.methodName} not found in ${TransversalClass.name}`
        );
      }

      // Extract role from pointcut if it follows the pattern: 'role-name' (without execution())
      // e.g., 'method-entry', 'authorization', 'audit'
      // or classic execution pattern: 'execution(ClassName.methodName)'
      const role = advice.pointcut.startsWith('execution(') 
        ? undefined 
        : advice.pointcut;

      advices.push({
        type: advice.type,
        pointcut: advice.pointcut,
        method,
        transversalInstance,
        priority: advice.priority || 0,
        enabled: advice.enabled ?? true,
        role,
      });
    }

    return advices;
  }

  /**
   * Gets applicable aspects for a target class.
   * Uses both global transversal metadata and local context configuration.
   * 
   * @param concrete The target class
   * @param contextId Optional assemblage context identifier for local filtering
   * @returns Array of applicable transversal metadata with local configuration applied
   */
  public getAspectsForTarget(concrete: Concrete<any>): TransversalMetadata[] {
    const applicable: TransversalMetadata[] = [];
    
      // Use global metadata (old behavior)
      for (const metadata of TransversalManager.transversalMetadata.values()) {
        if (this.hasMatchingAdviceForClass(metadata, concrete)) {
          applicable.push(metadata);
        }
      }
      return applicable;


    return applicable;
  }
  
  /**
   * Checks if a transversal has any advice matching the target class.
   * 
   * @param metadata The transversal metadata
   * @param concrete The target class
   * @returns True if any advice matches
   */
  private hasMatchingAdviceForClass(metadata: TransversalMetadata, concrete: Concrete<any>): boolean {
    return metadata.advices.some(advice => {
      if (!advice.enabled) return false;
      
      // Extract class name from pointcut pattern
      // Format: execution(ClassName.methodName)
      const match = advice.pointcut.match(/execution\(([^.]+)\.[^)]+\)/);
      if (match) {
        const classPattern = match[1];
        const classRegex = this.patternToRegex(classPattern);
        return classRegex.test(concrete.name);
      }
      
      return false;
    });
  }

  /**
   * Converts a wildcard pattern to a regular expression.
   * Reused from PointcutMatcher logic.
   * 
   * @param pattern The pattern with wildcards
   * @returns A RegExp for matching
   */
  private patternToRegex(pattern: string): RegExp {
    if (pattern === '*') {
      return /.*/;
    }
    
    // Escape special regex characters except *
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    // Replace * with .*
    const regex = escaped.replace(/\*/g, '.*');
    return new RegExp(`^${regex}$`);
  }

  /**
   * Gets advices applicable to a specific join point.
   * Includes advices from:
   * 1. Aspects matched by pointcut regex (automatic)
   * 2. Aspects explicitly applied via @Affect decorator (manual)
   * 
   * @param joinPoint The join point to match
   * @param aspects The aspects to search (from pointcut matching)
   * @param contextId Optional context identifier for method filtering
   * @param target Optional target instance (for @Affect lookup)
   * @param propertyKey Optional property key (for @Affect lookup)
   * @returns Array of applicable advices, sorted by priority (highest first)
   */
  public getAdvicesForJoinPoint(
    joinPoint: JoinPoint,
    transversals: TransversalMetadata[],
    target?: any,
    propertyKey?: string | symbol
  ): Advice[] {
    const advices: Advice[] = [];

    // 1. Get advices from pointcut-matched aspects
    for (const transversal of transversals) {
      
      for (const advice of transversal.advices) {
        if (!advice.enabled) continue;

        // Check pointcut matching
        const matcher = PointcutMatcher.parse(advice.pointcut);
        if (matcher.matches(joinPoint)) {
          advices.push(advice);
        }
      }
    }

    // 2. Get advices from @Affect decorators
    if (target && propertyKey) {
      // Get affected methods from the class prototype (decorators are stored on the class prototype)
      // We need to use target.constructor.prototype because target is an instance
      const prototype = target.constructor.prototype;
      const affectedMethods = getAffectedMethods(prototype, propertyKey);
      
      for (const applied of affectedMethods) {
        // Get the transversal identifier (can be abstract or concrete)
        const transversalIdentifier = applied.transversal;
        const transversalClassName = typeof transversalIdentifier === 'function' 
          ? transversalIdentifier.name 
          : String(transversalIdentifier);
        
        // Try to find metadata by concrete class name first
        let metadata = TransversalManager.transversalMetadata.get(transversalClassName);
        
        // If not found and transversalIdentifier is a function, try to find by checking if it extends an abstract class
        if (!metadata && typeof transversalIdentifier === 'function') {
          // Check if this class is registered under its parent (abstract) name
          const parentClass = Object.getPrototypeOf(transversalIdentifier);
          if (parentClass && parentClass.name) {
            metadata = TransversalManager.transversalMetadata.get(parentClass.name);
          }
        }
        if (!metadata) {
          console.warn(`@Affect: Transversal ${transversalClassName} not found. Make sure it's registered in transversals[].`);
          continue;
        }
        
        // Filter advices by role if specified
        for (const advice of metadata.advices) {
          if (!advice.enabled) continue;
          
          // Filter by role if specified in @Affect
          if (applied.role && advice.role !== applied.role) {
            continue;
          }
          
          // Add the advice (bypass pointcut matching for explicitly affected methods)
          advices.push(advice);
        }
      }
    }

    // Sort by priority (higher priority executes first)
    return advices.sort((a, b) => b.priority - a.priority);
  }
}
