/**
 * Check at given interval if a condition becomes truthy to call an async method.
 *
 * @param { string | ((instance?: any) => boolean | Promise<boolean>) } condition
 * The property name or function used as readiness condition.
 * @param { number | undefined } interval The interval in milliseconds at which the value is checked (defaults to 25 milliseconds).
 * @returns { Promise<any> } A promise that calls and returns the original method result when resolving.
 */
export const Await = (
  condition: string | ((instance?: any) => boolean | Promise<boolean>),
  interval = 25
): MethodDecorator => {
  return ((
    _target: any,
    _propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...params: any[]) => Promise<any>>
  ) => {
    const originalFn = descriptor.value!;

    const isReady = async (instance: any): Promise<boolean> => {
      const value = typeof condition === 'function' ? condition(instance) : instance[condition];

      if (typeof value === 'function') {
        const fnResult = value.call(instance);
        return Boolean(await Promise.resolve(fnResult));
      }

      return Boolean(await Promise.resolve(value));
    };

    descriptor.value = async function (...params: any[]): Promise<any> {
      while (!(await isReady(this))) {
        await new Promise((resolve) => setTimeout(resolve, interval));
      }

      return originalFn.apply(this, params);
    };
  }) as MethodDecorator;
};
