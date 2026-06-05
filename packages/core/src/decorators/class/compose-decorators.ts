/**
 * A flexible decorator type that accepts both standard ClassDecorator
 * and constructor-specific decorators that return the modified class.
 */
export type AnyClassDecorator =
  | ClassDecorator
  | (<T extends new (...args: any[]) => any>(target: T) => T)
  | ((target: Function) => Function | void);

/**
 * Composes multiple class decorators into a single decorator.
 *
 * Decorators are applied in the order they are provided, with each decorator
 * receiving the result of the previous one. This allows for clean composition
 * of decorator behaviors without nested decorator syntax.
 *
 * Accepts both standard TypeScript `ClassDecorator` and constructor decorators
 * (e.g., from AssemblerJS `createConstructorDecorator`).
 *
 * @param decorators - The class decorators to compose, in order of application
 * @returns A single class decorator that applies all provided decorators
 *
 * @example
 * ```typescript
 * // Instead of:
 * @Decorator1()
 * @Decorator2()
 * @Decorator3()
 * class MyClass {}
 *
 * // You can write:
 * const Combined = composeDecorators(
 *   Decorator1(),
 *   Decorator2(),
 *   Decorator3()
 * );
 *
 * @Combined
 * class MyClass {}
 * ```
 */
export function composeDecorators(
  ...decorators: AnyClassDecorator[]
): ClassDecorator {
  return (target: Function) => {
    return decorators.reduce((currentTarget, decorator) => {
      const result = (decorator as any)(currentTarget);
      return (result as Function | void) || currentTarget;
    }, target) as any;
  };
}
