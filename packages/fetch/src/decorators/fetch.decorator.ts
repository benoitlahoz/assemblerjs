import { Either, Maybe, Task } from '@assemblerjs/core';
import { ReflectParse, ResponseMethod } from './parse.decorator';
import { methodNameForType } from '@/utils';
import { ReflectParam } from './param.decorator';
import { ReflectQuery } from './query.decorator';

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

// Create a new URL with queries passed as parameters through the use of the `Query` decorator.

const replaceQueryValues = (
  path: string,
  decoratedParameters: Record<string, string>,
  ...args: any
) => {
  const url = new URL(path);
  const urlParameters = url.searchParams;

  for (let index = 0; index < args.length; index++) {
    const key = decoratedParameters[String(index)];
    if (key) {
      let value: any = args[index];
      if (Array.isArray(value)) {
        value = value.join(',');
      } else {
        value = String(value);
      }
      urlParameters.set(key, value);
    }
  }

  const newURL = new URL(
    `${url.origin}${url.pathname}?${urlParameters.toString()}`
  );

  return newURL;
};

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
      method === 'PUT';

    // Get expected type (if a `Parse` decorator was applied).

    const expectedResponseType: Maybe<ResponseMethod> = Maybe.of(
      Reflect.getOwnMetadata(ReflectParse.ExpectedType, (target as any)[prop])
    );

    // Get eventual `Param` decorators strings to search and indexes in the method signature.

    const ParamDecoratorValues =
      Reflect.getOwnMetadata(ReflectParam.Value, target) || {};
    const paramsLength = ParamDecoratorValues.length;

    // Get eventual `Query` decorators strings to search and indexes in the method signature.

    const QueryDecoratorValues =
      Reflect.getOwnMetadata(ReflectQuery.Value, target) || {};
    const queryLength = QueryDecoratorValues.length;

    // New function.

    descriptor.value = async function (...args: any[]) {
      // Get eventual parameters passed to the method.

      let response: any = null;
      let error: Error | null = null;
      let statusCode = 500;

      // Body must be the first parameter (after eventual `Query` or `Param` decorators) if method should pass a body.
      const body: any = isBodyMethod
        ? args[paramsLength + queryLength]
        : undefined;

      // Main task.

      const fetchAPI = Task.of(() => {
        const newURL = replaceQueryValues(path, QueryDecoratorValues, ...args);
        return newURL.toString();
      })
        .map((newPath: string) => {
          for (const [key, value] of Object.entries(ParamDecoratorValues)) {
            newPath = newPath.replace(value as string, args[Number(key)]);
          }
          return newPath;
        })
        .map(
          async (newPath: string) =>
            (await fetch(newPath, {
              method,
              body,
              headers: options?.headers,
            })) as any
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
        ? original.apply(this, [...args, body, response, error, statusCode])
        : original.apply(this, [...args, response, error, statusCode]);
    };
  };
};
