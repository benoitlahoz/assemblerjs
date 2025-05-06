import { Either, Maybe, Task } from '@assemblerjs/core';
import { ReflectParse, ResponseMethod } from './parse.decorator';
import { methodNameForType } from '@/utils';
import { ReflectParam } from './param.decorator';
import { ReflectQuery } from './query.decorator';
import { ReflectPlaceholder } from './placeholder.decorator';

export enum ReflectFetch {
  DecoratedMethods = 'fetch.decorator:decorated.methods',
}

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

  const questionMark = Array.from(urlParameters).length > 0 ? '?' : '';
  const newURL = new URL(
    `${url.origin}${url.pathname}${questionMark}${urlParameters.toString()}`
  );

  return newURL;
};

export const Fetch = (
  method: string,
  path: string,
  options?: RequestInit
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

    // Get eventual `Param`, `Query` or `Placeholder` decorators strings to search and indexes in the method signature.

    const ParamDecoratorValues =
      Reflect.getOwnMetadata(ReflectParam.Value, (target as any)[prop]) || {};
    const paramsLength = Object.keys(ParamDecoratorValues).length;

    const QueryDecoratorValues =
      Reflect.getOwnMetadata(ReflectQuery.Value, (target as any)[prop]) || {};
    const queryLength = Object.keys(QueryDecoratorValues).length;

    const PlaceholderDecoratorValues =
      Reflect.getOwnMetadata(ReflectPlaceholder.Value, (target as any)[prop]) ||
      {};
    const placeholderLength = Object.keys(PlaceholderDecoratorValues).length;

    const decoratedParametersLength =
      paramsLength + queryLength + placeholderLength;

    // New function.

    descriptor.value = async function (...args: any[]) {
      // Get eventual parameters passed to the method.

      let response: any = null;
      let error: Error | null = null;
      let statusCode = 500;

      // Body must be the first parameter (after eventual `Placeholder` decorator) if method should pass a body.
      const body: any = isBodyMethod
        ? args[paramsLength + queryLength]
        : undefined;

      // TODO -> in the task.
      let finalPath = path;
      // Main task.

      const fetchAPI = Task.of(() => {
        const newURL = replaceQueryValues(path, QueryDecoratorValues, ...args);
        return newURL.toString();
      })
        .map((newPath: string) => {
          for (const [key, value] of Object.entries(ParamDecoratorValues)) {
            newPath = newPath.replaceAll(value as string, args[Number(key)]);
          }
          return newPath;
        })
        .map((newPath: string) => {
          for (const [key, value] of Object.entries(
            PlaceholderDecoratorValues
          )) {
            const index = Number(key);
            if (typeof args[index] === 'undefined') {
              newPath = newPath.replaceAll(value as string, '');
            } else {
              newPath = newPath.replaceAll(value as string, args[Number(key)]);
            }
          }
          return newPath;
        })
        .map(async (newPath: string) => {
          finalPath = newPath;
          return (await fetch(newPath, {
            ...(options || {}),
            method,
            body,
            headers: options?.headers,
          })) as any;
        })
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

      // Handle optional parameters by inserting 'undefined' in case the parameter wasn't provided.

      const argsDiff = decoratedParametersLength - args.length;
      const optional = Array.from({ length: argsDiff }, () => undefined);
      args.push(...optional);

      // NB: `this` refers to the class instance.

      return original.apply(this, [
        ...args,
        response,
        error,
        statusCode,
        finalPath,
      ]);
    };
  };
};
