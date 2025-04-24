/**
 * A concrete (newable) class.
 */
export interface Concrete<T> extends Function {
  new (...args: any[]): T;
}

/**
 * An abstract class.
 */
export type Abstract<T = void> = abstract new (...args: any[]) => T;

/**
 * An abstract or concretee class.
 */
export type Class<T> = Concrete<T> | Abstract<T>;
