/**
 * Cache the result of a class method.
 */
export const Memo =
  (/* options to come here */): MethodDecorator =>
  (_: any, key: string | symbol, descriptor: PropertyDescriptor) => {
    const cache: Map<string, any> = new Map();

    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const cacheKey = `${String(key)}:${args.join(',')}`;

      if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
      }

      const result = originalMethod.apply(this, args);
      cache.set(cacheKey, result);

      return result;
    };

    return descriptor;
  };
