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
  /** The name of the calling assemblage class (if available) */
  caller?: string;
  /** The identifier of the calling assemblage (if available) */
  callerIdentifier?: string | symbol;
}

/**
 * Advice execution context.
 * Extends JoinPoint with the proceed function for around advice.
 */
export interface AdviceContext extends JoinPoint {
  /** Function to proceed to the next advice or the original method (for around advice) */
  proceed?: () => any;
  /** Optional config specific to this advice execution (from @Affect) */
  config?: Record<string, any>;
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
  /** The transversal instance that owns this advice */
  transversalInstance: any;
  /** The priority of this advice (higher values execute first) */
  priority: number;
  /** Whether this advice is enabled */
  enabled: boolean;
  /** Optional role identifier extracted from pointcut */
  role?: string;
  /** Optional config specific to this advice (from @Affect) */
  config?: Record<string, any>;
}

/**
 * Transversal metadata.
 * Contains information about a registered transversal.
 */
export interface TransversalMetadata {
  /** The assemblage definition of the transversal */
  definition: any;
  /** The advices defined in this transversal */
  advices: Advice[];
  /** The transversal instance */
  instance?: any;
}

/**
 * Transversal configuration for a specific assemblage context.
 * Stores how a transversal should be applied in this particular context.
 */
export interface TransversalContextConfig {
  /** The transversal class name (used as key) */
  transversalClassName: string;
  /** The transversal instance (singleton shared across contexts) */
  transversalInstance: any;
  /** Optional role filter: only apply advices with this role */
  role?: string;
  /** Optional method filter: only apply to these methods */
  methods?: string[] | ((methodName: string) => boolean) | '*';
}
