import type { Identifier } from '@/shared/common';
import type { Injection, InstanceInjection } from '@/features/assemblage';
import {
  resolveInjectionTuple,
  resolveInstanceInjectionTuple,
} from '@/features/assemblage';
import { Injectable } from '@/features/injectable';
import type { AssemblerContext, AssemblerPrivateContext } from '../model/types';
import { HookManager } from './hook-manager';
import { SingletonStrategy, TransientStrategy } from './resolution-strategies';
import { DebugLogger } from './debug-logger';
import { isClass } from '@assemblerjs/core';

/**
 * Format an identifier for display in error messages
 */
export function formatIdentifier(identifier: any): string {
  // Handle undefined/null early
  if (identifier === undefined) return 'undefined';
  if (identifier === null) return 'null';
  
  // Check if it's a function (class, abstract class, or regular function)
  if (typeof identifier === 'function') {
    // Try to get the name from the function itself
    if (identifier.name) return identifier.name;
    
    // For anonymous functions, try constructor name
    if (identifier.constructor?.name && identifier.constructor.name !== 'Function') {
      return identifier.constructor.name;
    }
    
    return 'AnonymousFunction';
  }
  
  // Handle primitives
  if (typeof identifier === 'string') return identifier;
  if (typeof identifier === 'symbol') return identifier.toString();
  if (typeof identifier === 'number') return String(identifier);
  if (typeof identifier === 'boolean') return String(identifier);
  
  // For objects, try to provide useful information
  if (typeof identifier === 'object') {
    // Try name property first (for named objects)
    if (identifier.name && typeof identifier.name === 'string') {
      return identifier.name;
    }
    
    // Check constructor name first (important for class instances)
    const constructorName = identifier.constructor?.name;
    if (constructorName && constructorName !== 'Object') {
      return constructorName;
    }
    
    try {
      // If it's a simple object, show a compact JSON representation
      const json = JSON.stringify(identifier);
      // Limit length to keep logs readable
      if (json.length > 100) {
        return json.substring(0, 100) + '...';
      }
      return json;
    } catch {
      // Final fallback
      return '[UnknownObject]';
    }
  }
  
  return String(identifier);
}

/**
 * Determine the type of dependency (class, string, symbol, etc.)
 */
function getDependencyType(identifier: any): string {
  // Check if it's a class (concrete or abstract)
  if (isClass(identifier)) {
    // Try to determine if it's likely an abstract class
    // Note: TypeScript's abstract is compile-time only, so we can't reliably detect it at runtime
    // However, we can check if it's likely abstract by looking for prototype methods
    const hasPrototypeMethods = identifier.prototype && 
      Object.getOwnPropertyNames(identifier.prototype).length > 1; // More than just 'constructor'
    
    return hasPrototypeMethods ? 'class' : 'class';
  }
  
  if (typeof identifier === 'function') return 'function';
  if (typeof identifier === 'string') return 'string';
  if (typeof identifier === 'symbol') return 'symbol';
  if (typeof identifier === 'object' && identifier !== null) return 'object';
  
  return 'unknown';
}

export class InjectableManager {
  private injectables: Map<Identifier<unknown>, Injectable<unknown>> = new Map();
  private resolvingStack: Set<Identifier<unknown>> = new Set();
  private privateContext!: AssemblerPrivateContext;
  private publicContext!: AssemblerContext;
  private singletonStrategy = new SingletonStrategy();
  private transientStrategy = new TransientStrategy();

  public setContexts(privateContext: AssemblerPrivateContext, publicContext: AssemblerContext): void {
    this.privateContext = privateContext;
    this.publicContext = publicContext;
  }

  public register<T>(injection: Injection<T>, instance = false): Injectable<T> {
    const logger = DebugLogger.getInstance();

    const buildable =
      instance === true
        ? resolveInstanceInjectionTuple(injection as InstanceInjection<T>)
        : resolveInjectionTuple(injection);

    if (this.has(buildable.identifier)) {
      const errorMessage = `An assemblage is already registered with identifier '${buildable.identifier.name}'.`;
      
      logger.log('error', 'Duplicate registration', {
        identifier: buildable.identifier.name,
        error: errorMessage,
      });
      
      throw new Error(errorMessage);
    }

    // Recursively register injectable's own dependencies.
    const injectable = Injectable.of<T>(
      buildable as any,
      this.privateContext,
      this.publicContext
    );

    // Log registration
    logger.logRegistration(injectable);

    // Cache injectable.
    this.injectables.set(injectable.identifier as Identifier<T>, injectable);

    // Call 'onRegister' hook only when a concrete assemblage exists.
    if (injectable.concrete) {
      HookManager.callHook(
        injectable.concrete,
        'onRegister',
        this.publicContext,
        injectable.configuration
      );
    }

    return injectable as Injectable<T>;
  }

  public has<T>(identifier: Identifier<T>): boolean {
    return this.injectables.has(identifier as Identifier<T>);
  }

  public require<T>(
    identifier: Identifier<T>,
    configuration?: Record<string, any>,
    caller?: Identifier<any>
  ): T {
    if (!this.injectables.has(identifier as Identifier<T>)) {
      const isCircular = this.resolvingStack.has(identifier as Identifier<T>);
      const errorType = isCircular ? 'Circular dependency detected' : 'Dependency not registered';
      const identifierName = formatIdentifier(identifier);
      const dependencyType = getDependencyType(identifier);
      const paramIndex = configuration?.__paramIndex;
      const paramCount = configuration?.__paramCount;
      const expectedType = configuration?.__expectedType;
      const errorMessage = isCircular
        ? `Circular dependency detected: '${identifierName}' is already being resolved.`
        : `Dependency '${identifierName}' has not been registered (Class/Service not found in current assemblages).`;
      
      const errorData: any = {
        identifier: identifierName,
        caller: caller ? formatIdentifier(caller) : 'unknown',
        type: dependencyType,
        error: errorMessage,
      };
      
      // Add parameter info if available (helps debug minification issues)
      if (paramIndex !== undefined) {
        errorData.paramIndex = paramIndex;
      }
      if (paramCount !== undefined) {
        errorData.paramCount = paramCount;
      }
      if (expectedType !== undefined) {
        // Use the expected type name directly (from TypeScript metadata, not minified)
        const expectedTypeName = (expectedType as any)?.name || formatIdentifier(expectedType);
        errorData.expectedType = expectedTypeName;
      }
      
      DebugLogger.getInstance().log('error', errorType, errorData);
      
      throw new Error(errorMessage);
    }

    const injectable = this.injectables.get(
      identifier as Identifier<T>
    )! as Injectable<T>;

    // Track resolution start
    this.resolvingStack.add(injectable.identifier as Identifier<any>);

    try {
      if (injectable.isSingleton) {
        return this.singletonStrategy.resolve(injectable, configuration);
      } else {
        return this.transientStrategy.resolve(injectable, configuration);
      }
    } finally {
      // Always cleanup after resolution (success or error)
      this.resolvingStack.delete(injectable.identifier as Identifier<any>);
    }
  }

  public concrete<T>(identifier: Identifier<T>): any | undefined {
    const injectable = this.injectables.get(identifier as Identifier<T>);

    if (injectable) return injectable.concrete;

    return;
  }

  public tagged(...tags: string[]): unknown[] {
    const res: any[] = [];
    for (const tag of tags) {
      for (const [_, injectable] of this.injectables) {
        if (injectable.tags.includes(tag)) res.push(injectable.build());
      }
    }
    return res;
  }

  public dispose(): void {
    for (const [_, injectable] of this.injectables) {
      injectable.dispose();
    }
    // Clear resolving stack
    this.resolvingStack.clear();
  }

  public get size(): number {
    return this.injectables.size;
  }

  public getRegisteredIdentifiers(): string[] {
    return Array.from(this.injectables.keys()).map(id => 
      (id as any)?.name || String(id)
    );
  }

  /**
   * Get the injectables map for cycle detection and other analysis
   */
  public getInjectables(): Map<Identifier<any>, any> {
    return this.injectables;
  }
}
