import type { Concrete } from '@assemblerjs/core';
import { isClass } from '@assemblerjs/core';
import type { AssemblerContext } from '@/features/assembler';
import type { AspectInjection, AspectConfig } from '@/features/assemblage';
import type { AspectMetadata, Advice, JoinPoint, AspectContextConfig } from '../types';
import { PointcutMatcher } from './pointcut-matcher';
import { getDefinition } from '@/features/assemblage';
import { getAppliedAspects } from '../decorators/apply-aspect';

/**
 * AspectManager manages aspect registration and advice resolution.
 * It is scoped to an AssemblerContext to ensure isolation between contexts.
 * 
 * Implements Solution 1: Singleton aspects with local configuration.
 * - Aspects are singleton instances shared globally
 * - Each assemblage context has its own configuration (role + methods)
 * - Same aspect can be configured differently in different contexts
 */
export class AspectManager {
  private static instances = new WeakMap<AssemblerContext, AspectManager>();
  
  // Global singleton aspect instances (shared across all contexts)
  private static aspectInstances = new Map<string, any>();
  
  // Global aspect metadata (shared across all contexts)
  private static aspectMetadata = new Map<string, AspectMetadata>();
  
  // Local configuration for this assemblage context
  private aspectConfigs = new Map<string, AspectContextConfig[]>();

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
   * Gets the singleton aspect instance by class name.
   * CRITICAL: This ensures that aspects injected in constructors use the same instance as weaving.
   * 
   * @param aspectClassName The name of the aspect class
   * @returns The aspect instance or undefined if not registered
   */
  public getAspectInstance(aspectClassName: string): any | undefined {
    return AspectManager.aspectInstances.get(aspectClassName);
  }

  /**
   * Clears all global aspect instances and metadata.
   * Useful for testing to reset state between tests.
   * WARNING: This will clear ALL aspects globally across all contexts.
   */
  public static resetGlobalState(): void {
    AspectManager.aspectInstances.clear();
    AspectManager.aspectMetadata.clear();
    AspectManager.instances = new WeakMap<AssemblerContext, AspectManager>();
  }

  /**
   * Registers an aspect from its injection definition.
   * The aspect is resolved from the context and its advices are extracted.
   * 
   * Supports both old array syntax and new AspectConfig object syntax:
   * - [AspectClass] - Simple injection
   * - [AspectClass, config] - With configuration
   * - [AbstractClass, ConcreteClass] - With abstraction
   * - [AbstractClass, ConcreteClass, config] - With abstraction and config
   * - { aspect, role, methods, config } - New syntax with role/methods filtering
   * 
   * @param aspectInjection The aspect injection tuple or config object
   * @param resolveContext Optional context to use for resolving the aspect (if different from manager's context)
   * @param assemblageIdentifier Optional identifier for the assemblage context (for configuration tracking)
   */
  public registerAspect(
    aspectInjection: AspectInjection<any>,
    resolveContext?: AssemblerContext,
    assemblageIdentifier?: string
  ): void {
    let AbstractClass: any;
    let AspectClass: any;
    let config: Record<string, any> | undefined;
    let role: string | undefined;
    let methods: string[] | ((methodName: string) => boolean) | '*' | undefined;
    
    // Check if new AspectConfig syntax
    if (!Array.isArray(aspectInjection)) {
      const aspectConfig = aspectInjection as AspectConfig;
      
      // Handle aspect: can be a class or [Abstract, Concrete]
      if (Array.isArray(aspectConfig.aspect)) {
        AbstractClass = aspectConfig.aspect[0];
        AspectClass = aspectConfig.aspect[1];
      } else {
        AbstractClass = aspectConfig.aspect;
        AspectClass = aspectConfig.aspect;
      }
      
      config = aspectConfig.config;
      role = aspectConfig.role;
      methods = aspectConfig.methods;
    } else {
      // Old array syntax (backward compatible)
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
    }
    
    const aspectClassName = AspectClass.name;
    
    // Check if aspect is already instantiated globally
    if (!AspectManager.aspectInstances.has(aspectClassName)) {
      // Resolve the aspect instance (singleton)
      const contextToUse = resolveContext || this.context;
      const aspectInstance = contextToUse.require(AbstractClass, config);
      const definition = getDefinition(AspectClass as any);

      if (!definition) {
        throw new Error(`Aspect ${aspectClassName} must be decorated with @Aspect`);
      }

      // Store singleton instance globally
      AspectManager.aspectInstances.set(aspectClassName, aspectInstance);
      
      // Store metadata globally
      const metadata: AspectMetadata = {
        definition: definition as any,
        advices: this.extractAdvices(AspectClass, aspectInstance),
        instance: aspectInstance,
      };
      AspectManager.aspectMetadata.set(aspectClassName, metadata);
    }
    
    // Store local configuration for this context
    const contextId = assemblageIdentifier || this.context.toString();
    const configs = this.aspectConfigs.get(contextId) || [];
    
    configs.push({
      aspectClassName,
      aspectInstance: AspectManager.aspectInstances.get(aspectClassName),
      role,
      methods,
    });
    
    this.aspectConfigs.set(contextId, configs);
  }

  /**
   * Extracts advices from an aspect class instance.
   * Advices are stored in definition.metadata.advices by the decorators.
   * Now also extracts role information from the pointcut.
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
        aspectInstance,
        priority: advice.priority || 0,
        enabled: advice.enabled ?? true,
        role,
      });
    }

    return advices;
  }

  /**
   * Gets applicable aspects for a target class.
   * Uses both global aspect metadata and local context configuration.
   * 
   * @param concrete The target class
   * @param contextId Optional assemblage context identifier for local filtering
   * @returns Array of applicable aspect metadata with local configuration applied
   */
  public getAspectsForTarget(concrete: Concrete<any>, contextId?: string): AspectMetadata[] {
    const applicable: AspectMetadata[] = [];
    const localConfigs = contextId ? this.aspectConfigs.get(contextId) : undefined;
    
    // If no local configs, return all global aspects (backward compatible)
    if (!localConfigs || localConfigs.length === 0) {
      // Use global metadata (old behavior)
      for (const metadata of AspectManager.aspectMetadata.values()) {
        if (this.hasMatchingAdviceForClass(metadata, concrete)) {
          applicable.push(metadata);
        }
      }
      return applicable;
    }
    
    // With local configs, filter by configuration
    for (const config of localConfigs) {
      const metadata = AspectManager.aspectMetadata.get(config.aspectClassName);
      if (!metadata) continue;
      
      // Filter advices based on local configuration (role + methods)
      const filteredAdvices = this.filterAdvicesByConfig(
        metadata.advices,
        config,
        concrete
      );
      
      if (filteredAdvices.length > 0) {
        // Create a copy of metadata with filtered advices
        applicable.push({
          ...metadata,
          advices: filteredAdvices,
        });
      }
    }

    return applicable;
  }
  
  /**
   * Checks if an aspect has any advice matching the target class.
   * 
   * @param metadata The aspect metadata
   * @param concrete The target class
   * @returns True if any advice matches
   */
  private hasMatchingAdviceForClass(metadata: AspectMetadata, concrete: Concrete<any>): boolean {
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
   * Filters advices based on local configuration (role + methods).
   * 
   * @param advices All advices from the aspect
   * @param config Local configuration for this context
   * @param concrete The target class
   * @returns Filtered advices
   */
  private filterAdvicesByConfig(
    advices: Advice[],
    config: AspectContextConfig,
    concrete: Concrete<any>
  ): Advice[] {
    return advices.filter(advice => {
      if (!advice.enabled) return false;
      
      // Filter by role if specified
      if (config.role && advice.role !== config.role) {
        return false;
      }
      
      // Check if advice applies to this class
      if (advice.pointcut.startsWith('execution(')) {
        const match = advice.pointcut.match(/execution\(([^.]+)\.[^)]+\)/);
        if (match) {
          const classPattern = match[1];
          const classRegex = this.patternToRegex(classPattern);
          if (!classRegex.test(concrete.name)) {
            return false;
          }
        }
      }
      
      return true;
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
   * 2. Aspects explicitly applied via @ApplyAspect decorator (manual)
   * 
   * @param joinPoint The join point to match
   * @param aspects The aspects to search (from pointcut matching)
   * @param contextId Optional context identifier for method filtering
   * @param target Optional target instance (for @ApplyAspect lookup)
   * @param propertyKey Optional property key (for @ApplyAspect lookup)
   * @returns Array of applicable advices, sorted by priority (highest first)
   */
  public getAdvicesForJoinPoint(
    joinPoint: JoinPoint,
    aspects: AspectMetadata[],
    contextId?: string,
    target?: any,
    propertyKey?: string | symbol
  ): Advice[] {
    const advices: Advice[] = [];
    const localConfigs = contextId ? this.aspectConfigs.get(contextId) : undefined;

    // 1. Get advices from pointcut-matched aspects
    for (const aspect of aspects) {
      // Find local config for this aspect
      const localConfig = localConfigs?.find(
        c => c.aspectClassName === aspect.instance?.constructor.name
      );
      
      for (const advice of aspect.advices) {
        if (!advice.enabled) continue;

        // Apply method filter from local configuration
        if (localConfig?.methods && !this.matchesMethodFilter(joinPoint.methodName, localConfig.methods)) {
          continue;
        }

        // Check pointcut matching
        const matcher = PointcutMatcher.parse(advice.pointcut);
        if (matcher.matches(joinPoint)) {
          advices.push(advice);
        }
      }
    }

    // 2. Get advices from @ApplyAspect decorators
    if (target && propertyKey) {
      // Get applied aspects from the class prototype (decorators are stored on the class prototype)
      // We need to use target.constructor.prototype because target is an instance
      const prototype = target.constructor.prototype;
      const appliedAspects = getAppliedAspects(prototype, propertyKey);
      
      for (const applied of appliedAspects) {
        // Get the aspect identifier (can be abstract or concrete)
        const aspectIdentifier = applied.aspect;
        const aspectClassName = typeof aspectIdentifier === 'function' 
          ? aspectIdentifier.name 
          : String(aspectIdentifier);
        
        // Try to find metadata by concrete class name first
        let metadata = AspectManager.aspectMetadata.get(aspectClassName);
        
        // If not found and aspectIdentifier is a function, try to find by checking if it extends an abstract class
        if (!metadata && typeof aspectIdentifier === 'function') {
          // Check if this class is registered under its parent (abstract) name
          const parentClass = Object.getPrototypeOf(aspectIdentifier);
          if (parentClass && parentClass.name) {
            metadata = AspectManager.aspectMetadata.get(parentClass.name);
          }
        }
        if (!metadata) {
          console.warn(`@ApplyAspect: Aspect ${aspectClassName} not found. Make sure it's registered in aspects[].`);
          continue;
        }
        
        // Filter advices by role if specified
        for (const advice of metadata.advices) {
          if (!advice.enabled) continue;
          
          // Filter by role if specified in @ApplyAspect
          if (applied.role && advice.role !== applied.role) {
            continue;
          }
          
          // Add the advice (bypass pointcut matching for explicitly applied aspects)
          advices.push(advice);
        }
      }
    }

    // Sort by priority (higher priority executes first)
    return advices.sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Checks if a method name matches the configured filter.
   * 
   * @param methodName The method name to test
   * @param filter The filter: array, predicate function, or '*'
   * @returns True if matches
   */
  private matchesMethodFilter(
    methodName: string,
    filter: string[] | ((methodName: string) => boolean) | '*'
  ): boolean {
    if (filter === '*') return true;
    if (Array.isArray(filter)) return filter.includes(methodName);
    if (typeof filter === 'function') return filter(methodName);
    return false;
  }
}
