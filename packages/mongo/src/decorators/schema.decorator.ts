import mongoose from 'mongoose';
import { TypeMetadataStorage } from './storages/type-metadata.storage';
import { ExtendedSchemaOptions } from './metadata';

export interface SchemaOptions extends mongoose.SchemaOptions {
  name?: string;
  plugins?: Array<{ package: Function; options?: any }>; // TODO: Correct type.
}

export const Schema = (options?: ExtendedSchemaOptions): ClassDecorator => {
  return (target: Function) => {
    TypeMetadataStorage.addSchemaMetadata({
      target,
      options,
    });
  };
};
