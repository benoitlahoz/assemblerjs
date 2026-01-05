/**
 * Type of advice: before, after, or around.
 */
export type AdviceType = 'before' | 'after' | 'around';

/**
 * Join point information.
 * Represents the point of execution where an advice is applied.
 */
export interface JoinPoint {
  /** The target instance */
  target: any;
  /** The name of the method being called */
  methodName: string;
  /** The arguments passed to the method */
  args: any[];
  /** The result of the method (for after advice) */
  result?: any;
  /** The error thrown by the method (if any) */
  error?: any;
}

/**
 * Advice execution context.
 * Extends JoinPoint with the proceed function for around advice.
 */
export interface AdviceContext extends JoinPoint {
  /** Function to proceed to the next advice or the original method (for around advice) */
  proceed?: () => any;
}

/**
 * Advice definition.
 * Represents a single advice to be applied at a join point.
 */
export interface Advice {
  /** The type of advice */
  type: AdviceType;
  /** The pointcut expression */
  pointcut: string;
  /** The advice method to execute */
  method: Function;
  /** The aspect instance that owns this advice */
  aspectInstance: any;
  /** The priority of this advice (higher values execute first) */
  priority: number;
  /** Whether this advice is enabled */
  enabled: boolean;
}

/**
 * Aspect metadata.
 * Contains information about a registered aspect.
 */
export interface AspectMetadata {
  /** The assemblage definition of the aspect */
  definition: any;
  /** The advices defined in this aspect */
  advices: Advice[];
  /** The aspect instance */
  instance?: any;
}
