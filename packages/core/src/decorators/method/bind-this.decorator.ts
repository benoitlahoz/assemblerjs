// https://github.com/NoHomey/bind-decorator/blob/master/src/index.ts

export const BindThis =
  <T extends Function>() =>
  (
    _target: object,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> | void => {
    if (!descriptor || typeof descriptor.value !== 'function') {
      throw new TypeError(
        `Only methods can be decorated with @bind. <${propertyKey}> is not a method!`
      );
    }

    return {
      configurable: true,
      get(this: T): T {
        const bound: T = descriptor.value!.bind(this);
        // Credits to https://github.com/andreypopp/autobind-decorator for memoizing the result of bind against a symbol on the instance.
        Object.defineProperty(this, propertyKey, {
          value: bound,
          configurable: true,
          writable: true,
        });
        return bound;
      },
    };
  };
