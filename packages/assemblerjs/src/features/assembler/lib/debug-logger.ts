import type { Injectable } from '@/features/injectable';
import type { AssemblerDebugOptions } from '../model/types';

/**
 * Format a target (class, function, object) for display in logs
 */
function formatTarget(target: any): string {
  // Handle undefined/null early
  if (target === undefined) return 'undefined';
  if (target === null) return 'null';
  
  // Check if it's a function (class or regular function)
  if (typeof target === 'function') {
    // Try to get the name from the function itself
    if (target.name) return target.name;
    
    // For anonymous functions, try constructor name but avoid "Function"
    if (target.constructor?.name && target.constructor.name !== 'Function') {
      return target.constructor.name;
    }
    
    return 'AnonymousFunction';
  }
  
  // For objects, try to get the constructor name first
  if (typeof target === 'object') {
    // Try name property first
    if (target.name && typeof target.name === 'string') {
      return target.name;
    }
    
    // Check constructor name (important for class instances)
    const constructorName = target.constructor?.name;
    if (constructorName && constructorName !== 'Object') {
      return constructorName;
    }
    
    return '[Object]';
  }
  
  return String(target);
}

/**
 * Abstract debug logger base class
 */
export abstract class AbstractDebugLogger {
  abstract configure(options: AssemblerDebugOptions): void;
  abstract log(level: 'info' | 'warn' | 'error', message: string, data?: any): void;
  abstract logBuildStart(entry: any): void;
  abstract logBuildEnd(entry: any, duration?: number): void;
  abstract logRegistration(injectable: Injectable<any>): void;
  abstract logHook(hookName: string, target: any, config?: any): (() => void) | void;
  abstract logPhaseStart(phase: string, context?: any): void;
  abstract logPhaseEnd(phase: string, duration?: number, context?: any): void;
  abstract logResolution(identifier: string, strategy: 'singleton' | 'transient', cacheHit: boolean): void;
  abstract logConstruction(target: string): void;
}

/**
 * NoOp implementation - Zero overhead, empty methods
 * Empty methods are intentional for the NoOp pattern
 */
/* eslint-disable @typescript-eslint/no-empty-function */
class NoOpDebugLogger implements AbstractDebugLogger {
  configure(_options: AssemblerDebugOptions): void {}
  log(_level: 'info' | 'warn' | 'error', _message: string, _data?: any): void {}
  logBuildStart(_entry: any): void {}
  logBuildEnd(_entry: any, _duration?: number): void {}
  logRegistration(_injectable: Injectable<any>): void {}
  logHook(_hookName: string, _target: any, _config?: any): void {}
  logPhaseStart(_phase: string, _context?: any): void {}
  logPhaseEnd(_phase: string, _duration?: number, _context?: any): void {}
  logResolution(_identifier: string, _strategy: 'singleton' | 'transient', _cacheHit: boolean): void {}
  logConstruction(_target: string): void {}
}
/* eslint-enable @typescript-eslint/no-empty-function */

/**
 * Active implementation - Real logging
 */
class ActiveDebugLogger implements AbstractDebugLogger {
  private options: AssemblerDebugOptions = {
    enabled: true,
    logPhases: {
      registration: true,
      resolution: true,
      construction: true,
      hooks: true,
      cache: true,
    },
    logTimings: false,
    logDependencyTree: true,
    useColors: true,
  };

  configure(options: AssemblerDebugOptions): void {
    this.options = {
      ...this.options,
      ...options,
      logPhases: {
        ...this.options.logPhases,
        ...(options.logPhases || {}),
      },
    };
  }

  logBuildStart(entry: any): void {
    this.log('info', 'Build started', { entry: entry.name });
  }

  logBuildEnd(entry: any, duration?: number): void {
    const data: any = { entry: entry.name };
    if (duration !== undefined) data.duration = `${duration.toFixed(2)}ms`;
    this.log('info', 'Build completed', data);
  }

  logRegistration(injectable: Injectable<any>): void {
    if (!this.shouldLog('registration')) return;

    this.log('info', 'Registration', {
      identifier: formatTarget(injectable.identifier),
      isSingleton: injectable.isSingleton,
      dependencies: injectable.dependencies.map(d => formatTarget(d)),
      tags: injectable.tags,
    });
  }

  logHook(hookName: string, target: any, config?: any): (() => void) | void {
    if (!this.shouldLog('hooks')) return;

    const startTime = this.options.logTimings ? performance.now() : 0;
    this.log('info', `Hook: ${hookName}`, {
      target: formatTarget(target),
      config,
    });

    if (this.options.logTimings) {
      return () => {
        const duration = performance.now() - startTime;
        this.log('info', `Hook: ${hookName} completed`, { duration: `${duration.toFixed(2)}ms` });
      };
    }
  }

  logPhaseStart(phase: string, context?: any): void {
    this.log('info', `Phase: ${phase} started`, context);
  }

  logPhaseEnd(phase: string, duration?: number, context?: any): void {
    const data = duration !== undefined ? { duration: `${duration.toFixed(2)}ms` } : {};
    if (context) {
      Object.assign(data, context);
    }
    this.log('info', `Phase: ${phase} ended`, Object.keys(data).length > 0 ? data : undefined);
  }

  logResolution(identifier: string, strategy: 'singleton' | 'transient', cacheHit: boolean): void {
    if (!this.shouldLog('resolution')) return;

    this.log('info', `Resolving: ${identifier}`, {
      strategy: `${strategy} strategy`,
      cache: cacheHit ? 'hit' : 'miss',
    });
  }

  logConstruction(target: string): void {
    if (!this.shouldLog('construction')) return;
    this.log('info', `Constructing: ${target}`);
  }

  private shouldLog(phase: string): boolean {
    return !this.options.logPhases || this.options.logPhases[phase as keyof typeof this.options.logPhases] !== false;
  }

  public log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (this.options.logger) {
      this.options.logger(level as any, message, data);
    } else {
      const prefix = `[Assembler:${level}]`;
      const coloredPrefix = this.options.useColors !== false
        ? this.colorize(level, prefix)
        : prefix;
      if (data) {
        // Log data directly without stringifying (let console handle arrays/objects)
        console.log(`${coloredPrefix} ${message}`, data);
      } else {
        console.log(`${coloredPrefix} ${message}`);
      }
    }
  }

  private colorize(level: string, text: string): string {
    // ANSI color codes
    const colors = {
      info: '\x1b[36m',    // Cyan
      warn: '\x1b[33m',    // Yellow
      error: '\x1b[31m',   // Red
      reset: '\x1b[0m',
    };

    const color = colors[level as keyof typeof colors] || colors.info;
    return `${color}${text}${colors.reset}`;
  }
}

/**
 * Factory singleton - Returns NoOp by default, Active when configured
 */
export class DebugLogger {
  private static instance: AbstractDebugLogger = new NoOpDebugLogger();

  public static getInstance(): AbstractDebugLogger {
    return DebugLogger.instance;
  }

  public static enable(options?: AssemblerDebugOptions): void {
    DebugLogger.instance = new ActiveDebugLogger();
    if (options) {
      DebugLogger.instance.configure(options);
    }
  }

  public static disable(): void {
    DebugLogger.instance = new NoOpDebugLogger();
  }
}
