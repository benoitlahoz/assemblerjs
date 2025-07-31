import type { Request, Response } from 'express';
import { DecoratedParameterPrivateKeys } from '@/decorators/parameters/parameters-decorators.keys';
import { MetadataStorage } from '@/metadata/metadata-storage';
import { switchCase } from '@assemblerjs/core';
import { AssemblerContext, getAssemblageContext } from 'assemblerjs';

const parseRequestDecorator = (
  args: any[],
  req: any,
  index: string | number
) => {
  args[Number(index)] = req; // Default to undefined if no value is found
};

const parseResponseDecorator = (
  args: any[],
  res: any,
  index: string | number
) => {
  args[Number(index)] = res; // Default to undefined if no value is found
};

const parseNextDecorator = (args: any[], next: any, index: string | number) => {
  args[Number(index)] = next; // Default to undefined if no value is found
};

const parseParamDecorator = (
  args: any[],
  req: any,
  identifier: string | symbol,
  index: string | number
) => {
  args[Number(index)] = req.params[String(identifier).toLowerCase()]; // Default to undefined if no value is found
};

const parseParamsDecorator = (
  args: any[],
  req: any,
  index: string | number
) => {
  const params: Record<string, any> = {};
  for (const [key, value] of Object.entries(req.params)) {
    params[key] = value;
  }
  args[Number(index)] = params; // Default to empty object if no params
};

const parseQueryDecorator = (
  args: any[],
  req: any,
  identifier: string | symbol,
  index: string | number
) => {
  args[Number(index)] = req.query[String(identifier).toLowerCase()]; // Default to undefined if no value is found
};

const parseQueriesDecorator = (
  args: any[],
  req: any,
  index: string | number
) => {
  const queries: Record<string, any> = {};
  for (const [key, value] of Object.entries(req.query)) {
    queries[key] = value;
  }
  args[Number(index)] = queries; // Default to empty object if no queries
};

const parseBodyDecorator = (args: any[], req: any, index: string | number) => {
  args[Number(index)] = req.body; // Default to undefined if no body
};

const parsePathDecorator = (args: any[], req: any, index: string | number) => {
  args[Number(index)] = req.path; // Default to undefined if no path
};

const parseHeaderDecorator = (
  args: any[],
  req: any,
  index: string | number
) => {
  args[Number(index)] = req.headers; // Default to empty object if no headers
};

const parseHeadersDecorator = (
  args: any[],
  req: any,
  index: string | number
) => {
  const headers: Record<string, any> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    headers[key] = value;
  }
  args[Number(index)] = headers; // Default to empty object if no headers
};

const parseCookieDecorator = (
  args: any[],
  req: any,
  identifier: string | symbol,
  index: string | number
) => {
  if (req.cookies) {
    args[Number(index)] = req.cookies[identifier]; // Default to undefined if no cookie
  } else {
    args[Number(index)] = undefined; // No cookies available
  }
};

const parseCookiesDecorator = (
  args: any[],
  req: any,
  index: string | number
) => {
  const cookies: Record<string, any> = {};
  if (req.cookies) {
    for (const [key, value] of Object.entries(req.cookies)) {
      cookies[key] = value;
    }
  }
  args[Number(index)] = cookies; // Default to empty object if no cookies
};

const parseCustomDecorator = async (
  args: any[],
  target: any,
  req: Request,
  res: Response,
  identifier: string | symbol,
  index: string | number,
  fn: (
    req: Request,
    res: Response,
    context: AssemblerContext,
    identifier?: string | symbol
  ) => void
) => {
  const context = getAssemblageContext(target.constructor);

  if (!context) {
    throw new Error('No AssemblerContext found for the target.');
  }

  const result = await fn(
    req,
    res,
    context,
    identifier ? String(identifier) : undefined
  );
  args[Number(index)] = result;
};

const switchDecorator = (
  args: any[],
  target: any,
  identifier: string | symbol,
  index: string | number,
  fn:
    | ((
        req: Request,
        res: Response,
        context: AssemblerContext,
        identifier?: string | symbol
      ) => void)
    | undefined,
  req: Request,
  res: Response,
  next: any
) =>
  switchCase({
    [DecoratedParameterPrivateKeys.Request]: () =>
      parseRequestDecorator(args, req, index),
    [DecoratedParameterPrivateKeys.Response]: () =>
      parseResponseDecorator(args, res, index),
    [DecoratedParameterPrivateKeys.Next]: () =>
      parseNextDecorator(args, next, index),
    [DecoratedParameterPrivateKeys.Param]: () =>
      parseParamDecorator(args, req, identifier, index),
    [DecoratedParameterPrivateKeys.Params]: () =>
      parseParamsDecorator(args, req, index),
    [DecoratedParameterPrivateKeys.Query]: () =>
      parseQueryDecorator(args, req, identifier, index),
    [DecoratedParameterPrivateKeys.Queries]: () =>
      parseQueriesDecorator(args, req, index),
    [DecoratedParameterPrivateKeys.Body]: () =>
      parseBodyDecorator(args, req, index),
    [DecoratedParameterPrivateKeys.Path]: () =>
      parsePathDecorator(args, req, index),
    [DecoratedParameterPrivateKeys.Header]: () =>
      parseHeaderDecorator(args, req, index),
    [DecoratedParameterPrivateKeys.Headers]: () =>
      parseHeadersDecorator(args, req, index),
    [DecoratedParameterPrivateKeys.Cookie]: () =>
      parseCookieDecorator(args, req, identifier, index),
    [DecoratedParameterPrivateKeys.Cookies]: () =>
      parseCookiesDecorator(args, req, index),
    [DecoratedParameterPrivateKeys.Custom]: async () =>
      await parseCustomDecorator(
        args,
        target,
        req,
        res,
        identifier,
        index,
        fn!
      ),
  });

export const parseParametersDecorators = async (
  args: any[],
  target: any,
  handlerName: string | symbol | undefined,
  req: Request,
  res: Response,
  next: any
): Promise<any[]> => {
  for (const typeKey of Object.values(DecoratedParameterPrivateKeys)) {
    if (typeKey === DecoratedParameterPrivateKeys.Custom) {
      // Skip custom parameters here, they are handled separately
      continue;
    }
    // Get metadata for the current typeKey
    const metadata = MetadataStorage.getParametersOfTypeForHandler(
      target,
      handlerName,
      typeKey
    );
    if (!metadata) {
      continue;
    }
    for (const [index, identifier] of Object.entries(metadata)) {
      const convertToArgs = switchDecorator(
        args,
        target,
        identifier,
        index,
        undefined,
        req,
        res,
        next
      );
      await convertToArgs(typeKey);
    }
  }

  // Handle custom parameters separately
  const customMetadata = MetadataStorage.getCustomParametersForHandler(
    target,
    handlerName
  );
  if (!customMetadata) {
    return args;
  }
  for (const [index, obj] of Object.entries(customMetadata)) {
    const convertToArgs = switchDecorator(
      args,
      target,
      obj.identifier,
      index,
      obj.fn,
      req,
      res,
      next
    );
    await convertToArgs(DecoratedParameterPrivateKeys.Custom);
  }
  return args;
};
