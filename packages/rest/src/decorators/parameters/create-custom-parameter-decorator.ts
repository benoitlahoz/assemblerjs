import type { Request, Response } from 'express';
import { AssemblerContext } from 'assemblerjs';
import { MetadataStorage } from '@/metadata/metadata-storage';

export const createCustomParameterDecorator =
  (
    fn: (
      req: Request,
      res: Response,
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
