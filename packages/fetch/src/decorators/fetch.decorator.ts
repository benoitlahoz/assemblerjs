/**
 * @assemblerjs/fetch
 * Fetch decorator for AssemblerJS.
 *
 * @benoitlahoz We could add a parameter decorator to handle redirections.
 */

import { Maybe, NoOp, Task } from '@assemblerjs/core';
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
  path: string;
  options?: RequestInit;
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
    | ReadableStream;
  response?: Response;
  status?: FetchStatus;
  data?: any;
  error?: Error | undefined;
}

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
  path: string,
  options?: RequestInit,
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

          res.body = getBodyInArgs(
            init.method,
            init.decoratedParametersLength,
            init.args
          );

          debugFn('Body is:', res.body); // TODO: To be continued.

          if (options) {
            debugFn(`Options are:`, options);
          } else {
            debugFn(`No options provided.`);
          }

          return res;
        })
          .map((result: FetchResult) => {
            let previousPath = result.path;

            if (typeof window !== 'undefined') {
              // In browser environment, we can use the URL constructor.
              previousPath = new URL(result.path, window.location.href).href;
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
              result.path,
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
              result.path,
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

            // https://stackoverflow.com/a/38236296/1060921
            const fetchRes = await fetch(res.path, {
              ...(res.options || {}),
              method: res.method,
              body: res.body,
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
        target,
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
