import type { Request, Response } from 'express';
import { DecoratedParameterPrivateKeys } from '@/decorators/parameters/parameters-decorators.keys';
import { AssemblerContext } from 'assemblerjs';

interface Metadata {
  handlerName: string | symbol;
  [key: string]: any;
}

export interface RouteMetadata extends Metadata {
  method: string;
  path: string;
  info: string;
}

export interface MiddlewareMetadata extends Metadata {
  function: Function;
}

export interface HttpStatusMetadata extends Metadata {
  status: number;
}

export interface HttpHeadersMetadata extends Metadata {
  headers: Record<string, string>;
}

export interface RedirectMetadata extends Metadata {
  location?: string;
  status?: number;
}

/**
 * Metadata for decorated parameters.
 * The key is the parameter type (e.g., body, param, query), and the value is an object
 * where the key is the handler name and the value is an object where the key is the index
 * and the value is the identifier (or null/undefined if not applicable).
 */
export type ParametersMetadata = {
  [key in DecoratedParameterPrivateKeys]: {
    [handlerName: string]: {
      [index: number]: string | symbol | null | undefined;
    };
  };
};

/**
 * Metadata for custom parameters.
 * The key is the property name, and the value is an object where the key is the
 * index and the value is an object containing the function and identifier.
 */
export type CustomParameterMetadata = {
  [property: string]: {
    [index: number]: {
      fn: (
        req: Request,
        res: Response,
        context: AssemblerContext,
        identifier: string | undefined
      ) => void;
      identifier: string | undefined;
    };
  };
};
