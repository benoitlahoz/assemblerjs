import { DecoratedParameterPrivateKeys } from './parameters-decorators.keys';
import { MetadataStorage } from '@/metadata/metadata-storage';

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
