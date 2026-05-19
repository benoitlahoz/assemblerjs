import { DecoratedParameterPrivateKeys } from './parameters-decorators.keys';
import { MetadataStorage } from '@/metadata/metadata-storage';
import { buildDecoratorParameterKey } from '@assemblerjs/common';

const writeCommonParameterMetadata = (
  type: 'body' | 'param' | 'query' | 'header',
  identifier: string | symbol,
  target: any,
  propertyKey: string | symbol | undefined,
  index: number
) => {
  if (typeof propertyKey === 'undefined') return;

  const key = buildDecoratorParameterKey(type);
  const method = target[String(propertyKey)];
  if (!method) return;

  const metadata =
    (Reflect.getMetadata(key, method) as Record<string, string | symbol> | undefined) || {};
  metadata[String(index)] = identifier;
  Reflect.defineMetadata(key, metadata, method);
};

export const Param = (identifier: string | symbol): ParameterDecorator => {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    index: number
  ) => {
    MetadataStorage.addParameter(
      DecoratedParameterPrivateKeys.Param,
      target,
      propertyKey,
      index,
      identifier
    );
    writeCommonParameterMetadata('param', identifier, target, propertyKey, index);
  };
};

export const Query = (identifier: string | symbol): ParameterDecorator => {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    index: number
  ) => {
    MetadataStorage.addParameter(
      DecoratedParameterPrivateKeys.Query,
      target,
      propertyKey,
      index,
      identifier
    );
    writeCommonParameterMetadata('query', identifier, target, propertyKey, index);
  };
};

export const Queries = (): ParameterDecorator => {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    index: number
  ) => {
    MetadataStorage.addParameter(
      DecoratedParameterPrivateKeys.Queries,
      target,
      propertyKey,
      index
    );
  };
};

export const Params = (): ParameterDecorator => {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    index: number
  ) => {
    MetadataStorage.addParameter(
      DecoratedParameterPrivateKeys.Params,
      target,
      propertyKey,
      index
    );
  };
};

export const Body = (): ParameterDecorator => {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    index: number
  ) => {
    MetadataStorage.addParameter(
      DecoratedParameterPrivateKeys.Body,
      target,
      propertyKey,
      index
    );
    writeCommonParameterMetadata('body', 'body', target, propertyKey, index);
  };
};

export const Path = (): ParameterDecorator => {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    index: number
  ) => {
    MetadataStorage.addParameter(
      DecoratedParameterPrivateKeys.Path,
      target,
      propertyKey,
      index
    );
  };
};

export const Header = (identifier: string | symbol): ParameterDecorator => {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    index: number
  ) => {
    MetadataStorage.addParameter(
      DecoratedParameterPrivateKeys.Header,
      target,
      propertyKey,
      index,
      identifier
    );
    writeCommonParameterMetadata('header', identifier, target, propertyKey, index);
  };
};

export const Headers = (): ParameterDecorator => {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    index: number
  ) => {
    MetadataStorage.addParameter(
      DecoratedParameterPrivateKeys.Headers,
      target,
      propertyKey,
      index
    );
  };
};

export const Cookie = (identifier: string | symbol): ParameterDecorator => {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    index: number
  ) => {
    MetadataStorage.addParameter(
      DecoratedParameterPrivateKeys.Cookie,
      target,
      propertyKey,
      index,
      identifier
    );
  };
};

export const Cookies = (): ParameterDecorator => {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    index: number
  ) => {
    MetadataStorage.addParameter(
      DecoratedParameterPrivateKeys.Cookies,
      target,
      propertyKey,
      index
    );
  };
};

export const Request = (): ParameterDecorator => {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    index: number
  ) => {
    MetadataStorage.addParameter(
      DecoratedParameterPrivateKeys.Request,
      target,
      propertyKey,
      index
    );
  };
};

export const Req = Request;

export const Response = (): ParameterDecorator => {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    index: number
  ) => {
    MetadataStorage.addParameter(
      DecoratedParameterPrivateKeys.Response,
      target,
      propertyKey,
      index
    );
  };
};

export const Res = Response;

export const Next = (): ParameterDecorator => {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    index: number
  ) => {
    MetadataStorage.addParameter(
      DecoratedParameterPrivateKeys.Next,
      target,
      propertyKey,
      index
    );
  };
};
