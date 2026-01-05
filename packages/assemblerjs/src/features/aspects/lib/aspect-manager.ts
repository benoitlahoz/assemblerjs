import type { Concrete } from '@assemblerjs/core';
import { isClass } from '@assemblerjs/core';
import type { AssemblerContext } from '@/features/assembler';
import type { AspectInjection } from '@/features/assemblage';
import type { AspectMetadata, Advice, JoinPoint } from '../types';
import { PointcutMatcher } from './pointcut-matcher';
import { getDefinition } from '@/features/assemblage';

/**
 * AspectManager manages aspect registration and advice resolution.
 * It is scoped to an AssemblerContext to ensure isolation between contexts.
 */
export class AspectManager {
  private static instances = new WeakMap<AssemblerContext, AspectManager>();
  private aspects = new Map<string, AspectMetadata>();

  private constructor(private context: AssemblerContext) {}

  /**
   * Gets or creates an AspectManager instance for a given context.
   * 
   * @param context The assembler context
   * @returns The AspectManager instance for this context
   */
  public static getInstance(context: AssemblerContext): AspectManager {
    let instance = this.instances.get(context);
    if (!instance) {
      instance = new AspectManager(context);
      this.instances.set(context, instance);
    }
    return instance;
  }

  /**
   * Registers an aspect from its injection definition.
   * The aspect is resolved from the context and its advices are extracted.
   * 
   * @param aspectInjection The aspect injection tuple
   * @param resolveContext Optional context to use for resolving the aspect (if different from manager's context)
   */
  public registerAspect(aspectInjection: AspectInjection<any>, resolveContext?: AssemblerContext): void {
    // Determine if this is an abstract/concrete pair or a direct injection
    let AbstractClass: any;
    let AspectClass: any;
    let config: Record<string, any> | undefined;
    
    if (aspectInjection.length === 1) {
      // [AspectClass]
      AbstractClass = aspectInjection[0];
      AspectClass = aspectInjection[0];
      config = undefined;
    } else if (aspectInjection.length === 2) {
      const second = aspectInjection[1];
      if (isClass(second)) {
        // [AbstractClass, ConcreteClass]
        AbstractClass = aspectInjection[0];
        AspectClass = second;
        config = undefined;
      } else {
        // [AspectClass, config]
        AbstractClass = aspectInjection[0];
        AspectClass = aspectInjection[0];
        config = second;
      }
    } else {
      // [AbstractClass, ConcreteClass, config]
      AbstractClass = aspectInjection[0];
      AspectClass = aspectInjection[1] as any;
      config = aspectInjection[2];
    }
    
    // Check if already registered (use concrete class name as key)
    if (this.aspects.has(AspectClass.name)) {
      return;
    }

    // Resolve the aspect instance from the provided context or fallback to manager's context
    // Use the abstract class as identifier to resolve from context
    const contextToUse = resolveContext || this.context;
    const aspectInstance = contextToUse.require(AbstractClass, config);
    const definition = getDefinition(AspectClass as any);

    if (!definition) {
      throw new Error(`Aspect ${AspectClass.name} must be decorated with @Aspect`);
    }

    const metadata: AspectMetadata = {
      definition: definition as any,
      advices: this.extractAdvices(AspectClass, aspectInstance),
      instance: aspectInstance,
    };

    this.aspects.set(AspectClass.name, metadata);
  }

  /**
   * Extracts advices from an aspect class instance.
   * Advices are stored in definition.metadata.advices by the decorators.
   * 
   * @param AspectClass The aspect class
   * @param aspectInstance The aspect instance
   * @returns Array of extracted advices
   */
  private extractAdvices(AspectClass: any, aspectInstance: any): Advice[] {
    const definition = getDefinition(AspectClass);
    const advices: Advice[] = [];

    // Advices are stored in definition.metadata.advices
    // (defined by @Before, @After, @Around decorators)
    const adviceMetadata = definition?.metadata?.advices || [];

    for (const advice of adviceMetadata) {
      const method = aspectInstance[advice.methodName];
      
      if (typeof method !== 'function') {
        throw new Error(
          `Advice method ${advice.methodName} not found in ${AspectClass.name}`
        );
      }

      advices.push({
        type: advice.type,
        pointcut: advice.pointcut,
        method,
        aspectInstance,
        priority: advice.priority || 0,
        enabled: advice.enabled ?? true,
      });
    }

    return advices;
  }

  /**
   * Gets applicable aspects for a target class.
   * Searches through ALL registered aspects in the context and filters by pointcut matching.
   * This respects SOLID principles: aspects are declared at assemblage level, not on services.
   * 
   * @param concrete The target class
   * @returns Array of applicable aspect metadata
   */
  public getAspectsForTarget(concrete: Concrete<any>): AspectMetadata[] {
    const applicable: AspectMetadata[] = [];

    // Iterate through ALL registered aspects in this context
    for (const metadata of this.aspects.values()) {
      // Check if any advice in this aspect matches the target class
      const hasMatchingAdvice = metadata.advices.some(advice => {
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

      if (hasMatchingAdvice) {
        applicable.push(metadata);
      }
    }

    return applicable;
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
   * Filters by pointcut matching and enabled status, then sorts by priority.
   * 
   * @param joinPoint The join point to match
   * @param aspects The aspects to search
   * @returns Array of applicable advices, sorted by priority (highest first)
   */
  public getAdvicesForJoinPoint(
    joinPoint: JoinPoint,
    aspects: AspectMetadata[]
  ): Advice[] {
    const advices: Advice[] = [];

    for (const aspect of aspects) {
      for (const advice of aspect.advices) {
        if (!advice.enabled) continue;

        const matcher = PointcutMatcher.parse(advice.pointcut);
        if (matcher.matches(joinPoint)) {
          advices.push(advice);
        }
      }
    }

    // Sort by priority (higher priority executes first)
    return advices.sort((a, b) => b.priority - a.priority);
  }
}
