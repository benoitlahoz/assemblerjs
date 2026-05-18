import type { HttpRequest, HttpResponse } from '@/http.types';
import { AssemblerContext } from 'assemblerjs';
import { MetadataStorage } from '@/metadata/metadata-storage';

export const createCustomParameterDecorator =
  (
    fn: (
      req: HttpRequest,
      res: HttpResponse,
      context: AssemblerContext,
      identifier: string | undefined
    ) => any | Promise<any>
  ) =>
  (identifier?: string): ParameterDecorator => {
    return (
      target: any,
      propertyKey: string | symbol | undefined,
      index: number
    ) => {
      MetadataStorage.addCustomParameter(
        target,
        propertyKey,
        index,
        fn,
        identifier
      );
    };
  };
