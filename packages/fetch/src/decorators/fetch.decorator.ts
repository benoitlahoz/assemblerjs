/**
 * @assemblerjs/fetch
 * Fetch decorator for AssemblerJS.
 *
 * @benoitlahoz We could add a parameter decorator to handle redirections.
 */

import { isAsync, isPromise, Maybe, NoOp, Task } from '@assemblerjs/core';
import { ReflectParse, ResponseMethod } from './parse.decorator';
import { parseResponseWithType, parseResponseWithUnknownType } from '@/utils';
import {
  ReflectParameters,
  ReflectParametersValues,
  getParameterDecoratorValues,
  transformParam,
  transformPlaceholder,
  transformQuery,
} from './parameter.decorators';

export interface FetchStatus {
  code: number;
  text: string;
}

type PathOrFunction<T = any> = string | ((target: T) => string);
type HeadersOrFunction<T = any> = HeadersInit | ((target: T) => HeadersInit | Promise<HeadersInit>);
type BodyOrFunction<T = any> = FetchResult['body'] | ((target: T) => FetchResult['body'] | Promise<FetchResult['body']>);

interface TaskInit {
  decoratedParametersValues: {
    param: ReflectParametersValues;
    placeholder: ReflectParametersValues;
    query: ReflectParametersValues;
  };
  decoratedParametersLength: number;
  responseType: Maybe<ResponseMethod>;
  method:
    | (
        | 'GET'
        | 'HEAD'
        | 'POST'
        | 'PUT'
        | 'DELETE'
        | 'CONNECT'
        | 'OPTIONS'
        | 'TRACE'
        | 'PATCH'
      )
    | string;
  path: PathOrFunction;
  options?: Omit<RequestInit, 'headers' | 'body'> & { 
    headers?: HeadersOrFunction; 
    body?: BodyOrFunction; 
  },
  target: any;
  propertyKey: string | symbol;
  args: any[];
}

export interface FetchResult extends TaskInit {
  body?:
    | string
    | ArrayBuffer
    | Blob
    | DataView
    | File
    | FormData
    // | TypedArray
    | URLSearchParams
    | ReadableStream
    | Promise<string | ArrayBuffer | Blob | DataView | File | FormData | URLSearchParams | ReadableStream>;
  response?: Response;
  status?: FetchStatus;
  data?: any;
  error?: Error | undefined;
}

const resolvePathValue = async (pathOrFn: PathOrFunction, target: any) => {
  let value: any;
  if (typeof pathOrFn === 'function') {
    // support (target) => string OR (target) => string | Promise<string>
    value = (pathOrFn as any)(target);
    if (isPromise(value) || isAsync(value)) {
      value = await value;
    }
  } else {
    value = pathOrFn;
  }

  // If it's a URL object, coerce to string
  if (value instanceof URL) {
    return value.href;
  }

  return String(value);
};

const buildParametersObject = (target: any, propertyKey: string | symbol) => {
  const param = getParameterDecoratorValues(
    ReflectParameters.Param,
    target,
    propertyKey
  );
  const query = getParameterDecoratorValues(
    ReflectParameters.Query,
    target,
    propertyKey
  );
  const placeholder = getParameterDecoratorValues(
    ReflectParameters.Placeholder,
    target,
    propertyKey
  );

  return {
    decoratedParametersValues: {
      param,
      placeholder,
      query,
    },
    decoratedParametersLength: param.length + placeholder.length + query.length,
  };
};

const getParseDecoratorResponseType = (
  target: any,
  propertyKey: string | symbol
) => {
  return Maybe.of(
    Reflect.getOwnMetadata(
      ReflectParse.ExpectedType,
      (target as any)[String(propertyKey)]
    )
  );
};

const getBodyInArgs = (
  method: string,
  decoratedLength: number,
  args: any[]
) => {
  const isBodyMethod =
    method === 'POST' ||
    method === 'UPDATE' ||
    method === 'PATCH' ||
    method === 'PUT';

  return isBodyMethod ? args[decoratedLength] : undefined;
};

export const Fetch = (
  method: string,
  path: PathOrFunction,
  options?: Omit<RequestInit, 'headers' | 'body'> & { 
    headers?: HeadersOrFunction; 
    body?: BodyOrFunction; 
  },
  debug?: boolean // TODO: we could pass a function there (and do it for every assemblerjs package).
): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>
  ) => {
    const original = descriptor.value;

    let debugFn = NoOp;
    if (debug) {
      debugFn = (reason: string, ...values: any[]) => {
        console.log(
          `%c[@assemblerjs/fetch]`,
          'color: blue;',
          reason,
          ...values
        );
      };
    }

    const parametersObject = buildParametersObject(target, propertyKey);
    const expectedResponseType: Maybe<ResponseMethod> =
      getParseDecoratorResponseType(target, propertyKey);

    // New function.

    descriptor.value = async function (...args: any[]) {
      const fetchAPI = (init: TaskInit) =>
        Task.of(() => {
          debugFn(
            `Begin '@Fetch' task:`,
            `${target.constructor.name}.${String(init.propertyKey)}`,
            '-------'
          );
          debugFn(`\nArguments (${args.length}):\n${init.args.join('\n')}`);

          const res: FetchResult = { ...init } as FetchResult;

          if (options?.body) {
            if (typeof options.body === 'function') {
              res.body = (options.body as (target: any) => FetchResult['body'] | Promise<FetchResult['body']>)(init.target) as any;
            } else {
              res.body = options.body;
            }
          } else {
            res.body = getBodyInArgs(
              init.method,
              init.decoratedParametersLength,
              init.args
            );
          }

          debugFn('Body is:', res.body); // TODO: To be continued.

          if (options) {
            debugFn(`Options are:`, options);
          } else {
            debugFn(`No options provided.`);
          }

          return res;
        })
          .map(async (result: FetchResult) => {
            const res = { ...result };
            res.path = await resolvePathValue(result.path as PathOrFunction, init.target);
            return res;
          })
          .map((result: FetchResult) => {
            let previousPath = result.path as string;

            if (typeof window !== 'undefined') {
              // In browser environment, we can use the URL constructor.
              previousPath = new URL(result.path as string, window.location.href).href;
            }

            const res = { ...result };
            res.path = transformPlaceholder(
              previousPath, // Was `result.path`
              result.decoratedParametersValues.placeholder,
              ...result.args
            );

            debugFn(
              `\nTransform @Placeholder\n`,
              `From: ${previousPath}\n`,
              `To: ${res.path}`
            );

            return res;
          })
          .map((result: FetchResult) => {
            const previousPath = result.path;

            const res = { ...result };
            res.path = transformParam(
              result.path as string,
              result.decoratedParametersValues.param,
              ...result.args
            );

            debugFn(
              `\nTransform @Param\n`,
              `From: ${previousPath}\n`,
              `To: ${res.path}`
            );

            return res;
          })
          .map((result: FetchResult) => {
            const previousPath = result.path;

            const res = { ...result };
            res.path = transformQuery(
              result.path as string,
              result.decoratedParametersValues.query,
              ...result.args
            );

            debugFn(
              `\nTransform @Query\n`,
              `From: ${previousPath}\n`,
              `To: ${res.path}`
            );

            return res;
          })
          .map(async (result: FetchResult) => {
            const res = { ...result };

            if (options?.headers && typeof options.headers === 'function') {
              const resolvedHeaders = await options.headers(result.target);
              res.options = { ...options, headers: resolvedHeaders };
            } else {
              res.options = options;
            }

            return res;
          })
          .map(async (result: FetchResult) => {
            const res = { ...result };

            if (res.body && isAsync(res.body) || isPromise(res.body)) {
              res.body = await res.body;
            }

            const fetchRes = await fetch(res.path as string, {
              ...(res.options as RequestInit) || {},
              method: res.method,
              // TODO: Type body properly.
              body: res.body as any,
            });

            if (!fetchRes.ok) {
              res.error = new Error(
                `${fetchRes.status}: ${fetchRes.statusText}`
              );
              debugFn(`Fetch error occurred:`, res.error);
            }

            res.response = fetchRes;
            res.status = {
              code: fetchRes.status,
              text: fetchRes.statusText,
            };

            return res;
          })
          .map(async (result: FetchResult) => {
            const res = { ...result };

            const getData = async () =>
              res.responseType.toEither().fold(
                async () => {
                  return await parseResponseWithUnknownType(result.response);
                },
                async (type: ResponseMethod) => {
                  return await parseResponseWithType(result.response, type);
                }
              );

            res.data = await getData();

            debugFn(`Final path is: ${res.path}`);

            debugFn(
              `End '@Fetch' task:`,
              `${target.constructor.name}.${String(init.propertyKey)}`,
              '-------'
            );

            return res;
          });

      // Init object for task.

      const initialObject: TaskInit = {
        ...parametersObject,
        responseType: expectedResponseType,
        method: method.toUpperCase(),
        path,
        options,
        target: this,
        propertyKey,
        args,
      };

      const runTask = fetchAPI(initialObject);
      const taskResult = await runTask.fork();

      let data: any;
      let error: Error | undefined;
      let finalPath = path;
      let status = {
        code: 500,
        text: 'Internal Server Error',
      };
      let decoratedParametersLength = 0;
      let newArgs = args;

      taskResult.fold<any, any>(
        (err: any) => {
          // Internal error.
          error = err as Error;
        },
        (success: any) => {
          data = success.data;

          // Fetch error.
          error = success.error;
          status = success.status || status;

          finalPath = success.path;
          decoratedParametersLength = success.decoratedParametersLength;
          newArgs = success.args || [];
        }
      );

      // Handle optional parameters by inserting 'undefined' in case the parameter wasn't provided.

      const argsDiff = decoratedParametersLength - newArgs.length;
      const optional = Array.from({ length: argsDiff }, () => undefined);
      newArgs.push(...optional);

      // NB: `this` refers to the class instance.

      return original.apply(this, [...newArgs, data, error, status, finalPath]);
    };
  };
};
