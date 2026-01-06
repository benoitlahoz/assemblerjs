import type { JoinPoint } from '../types';

/**
 * Interface for pointcut matchers.
 */
export interface IPointcutMatcher {
  /**
   * Tests if a join point matches the pointcut.
   * 
   * @param joinPoint The join point to test
   * @returns True if the pointcut matches
   */
  matches(joinPoint: JoinPoint): boolean;
}

/**
 * Factory for creating pointcut matchers from expressions.
 */
export class PointcutMatcher {
  /**
   * Parses a pointcut expression and returns a matcher.
   * 
   * Supported formats:
   * - "execution(ClassName.methodName)" - exact match
   * - "execution(ClassName.*)" - all methods in class
   * - "execution(*.methodName)" - method in any class
   * - "execution(*.*)" - all methods in all classes
   * 
   * @param expression The pointcut expression
   * @returns A matcher for the expression
   * @throws Error if the expression is invalid
   */
  public static parse(expression: string): IPointcutMatcher {
    const match = expression.match(/^execution\(([^.]+)\.([^)]+)\)$/);
    
    if (!match) {
      throw new Error(`Invalid pointcut expression: ${expression}`);
    }

    const [, classPattern, methodPattern] = match;
    return new ExecutionPointcutMatcher(classPattern, methodPattern);
  }
}

/**
 * Pointcut matcher for execution() expressions.
 * Supports wildcard patterns using *.
 */
class ExecutionPointcutMatcher implements IPointcutMatcher {
  private classRegex: RegExp;
  private methodRegex: RegExp;

  constructor(classPattern: string, methodPattern: string) {
    // Convert wildcard patterns to regex
    this.classRegex = this.patternToRegex(classPattern);
    this.methodRegex = this.patternToRegex(methodPattern);
  }

  public matches(joinPoint: JoinPoint): boolean {
    const className = joinPoint.target.constructor.name;
    const methodName = joinPoint.methodName;

    return (
      this.classRegex.test(className) &&
      this.methodRegex.test(methodName)
    );
  }

  /**
   * Converts a wildcard pattern to a regular expression.
   * 
   * @param pattern The pattern with wildcards
   * @returns A RegExp for matching
   */
  private patternToRegex(pattern: string): RegExp {
    if (pattern === '*') {
      return /.*/;
    }
    
    // Escape special regex characters except *
    const escaped = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');
    
    return new RegExp(`^${escaped}$`);
  }
}
