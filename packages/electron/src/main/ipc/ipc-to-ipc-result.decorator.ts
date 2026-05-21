import { IpcReturnType } from '@/universal/types';
import { asyncTryCatch, isAsync, isPromise, tryCatch } from '@assemblerjs/core';

export function ToIpcResult<T = any>(): MethodDecorator {
  return function (
    _target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const shouldRunAsync =
        isAsync(originalMethod) || isPromise(originalMethod);
      if (shouldRunAsync) {
        const result = await asyncTryCatch(
          async () => await originalMethod.apply(this, args)
        );
        return result.fold<IpcReturnType<T>, IpcReturnType<Error>>(
          (error) => ({
            data: null,
            err: error instanceof Error ? error : new Error(String(error)),
          }),
          (data: T) => {
            if (
              data instanceof Error ||
              (Array.isArray(data) && data.every((d) => d instanceof Error))
            ) {
              return {
                data: null,
                err: Array.isArray(data) ? (data[0] as Error) : (data as Error),
              };
            }
            return { data, err: null };
          }
        );
      } else {
        const result = tryCatch(() => originalMethod.apply(this, args));
        return result.fold<IpcReturnType<T>, IpcReturnType<Error>>(
          (error) => ({
            data: null,
            err: error instanceof Error ? error : new Error(String(error)),
          }),
          (data: T) => {
            if (data instanceof Error) {
              return { data: null, err: data };
            }
            return { data, err: null };
          }
        );
      }
    };

    return descriptor;
  };
}
