import { conditionally } from '@/conditional.utils';
import { isAsync, isPromise } from '@/type.validator';
import { Result, Task } from '@/monad-like';

export interface CatchDecoratorOptions {
  foldable: boolean;
}

export const Catch =
  (options: CatchDecoratorOptions = { foldable: false }): MethodDecorator =>
  (_: any, __: string | symbol, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    const asyncReturn = () => {
      descriptor.value = async function (...args: any[]) {
        const task = Task.of(
          async () => await originalMethod.apply(this, args)
        );

        const res = await task.fork();

        const ret = conditionally({
          if: () => options.foldable === true,
          then: () => res,
          else: () =>
            res.fold(
              (err: unknown) => err,
              (value: any) => value
            ),
        });

        return ret();
      };

      return descriptor;
    };

    const syncReturn = () => {
      descriptor.value = function (...args: any[]) {
        const task = Result.of(() => originalMethod.apply(this, args));

        const ret = conditionally({
          if: () => options.foldable === true,
          then: () => task(),
          else: () =>
            task().fold(
              (err: unknown) => err,
              (value: any) => value
            ),
        });

        return ret();
      };

      return descriptor;
    };

    const forkAsync = conditionally({
      if: () => isPromise(originalMethod) || isAsync(originalMethod),
      then: () => asyncReturn(),
      else: () => syncReturn(),
    });

    return forkAsync();
  };
