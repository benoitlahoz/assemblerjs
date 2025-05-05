import { Either, Maybe, Task } from '@assemblerjs/core';
import { FetchPrivateKeys } from './decorators.keys.private';
import { ResponseMethod } from './parse.decorator';
import { methodNameForType } from '@/utils';

export const Fetch = (
  method: string,
  path: string,
  options?: {
    headers?: Record<string, string>;
  }
): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>
  ) => {
    const original = descriptor.value;
    const prop = String(propertyKey);
    method = method.toUpperCase();

    // TODO: HEAD, OPTIONS
    const isBodyMethod =
      method === 'POST' ||
      method === 'UPDATE' ||
      method === 'PATCH' ||
      method === 'DELETE';

    // Call e.g. res['json']() => res.json() on response.
    const parseResponseWithType = async (res: any, type: ResponseMethod) => {
      return await res[type]();
    };

    // Try to get the format of the response.

    const parseUnknownResponse = async (res: any) => {
      const contentType = res.headers.get('content-type');
      const parseMethod = methodNameForType(contentType);
      return await res[parseMethod]();
    };

    // Get expected type (if an ExpectType decorator was applied).

    const expectedResponseType: Maybe<ResponseMethod> = Maybe.of(
      Reflect.getOwnMetadata(
        FetchPrivateKeys.ExpectedType,
        (target as any)[prop]
      )
    );

    descriptor.value = async function (...args: any[]) {
      let response: any = null;
      let error: Error | null = null;
      let statusCode = 500;

      // Body must be the first parameter if method should pass a body.
      const body: any = isBodyMethod ? args[0] : undefined;

      // Main task.

      const fetchAPI = Task.of(
        async () =>
          await fetch(path, {
            method,
            body,
            headers: options?.headers,
          })
      )
        .map((res: any) => {
          if (res.ok === false) {
            statusCode = res.status;
            throw new Error(res.statusText);
          }
          statusCode = res.status;
          return res;
        })
        .map(async (res: any) => {
          const type: Either<Error, ResponseMethod> =
            expectedResponseType.toEither();

          return type.fold(
            () => {
              return parseUnknownResponse(res);
            },
            (type: ResponseMethod) => {
              return parseResponseWithType(res, type);
            }
          );
        });

      // Execute the task.

      const taskRes = await fetchAPI.fork();

      // Fold the result.

      taskRes.fold(
        (err: unknown) => {
          response = null;
          error = err as Error;
        },
        (res: any) => {
          response = res;
          error = null;
        }
      );

      // `this` refers to the class instance.
      return isBodyMethod
        ? original.apply(this, [body, response, error, statusCode])
        : original.apply(this, [response, error, statusCode]);
    };
  };
};
