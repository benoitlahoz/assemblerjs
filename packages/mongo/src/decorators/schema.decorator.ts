import mongoose from 'mongoose';
import { TypeMetadataStorage } from './storages/type-metadata.storage';

export interface SchemaOptions extends mongoose.SchemaOptions {
  name?: string;
  plugins?: Array<{ package: Function; options?: any }>; // TODO: Correct type.
}

export const Schema = (options?: SchemaOptions): ClassDecorator => {
  return (target: Function) => {
    TypeMetadataStorage.addSchemaMetadata({
      target,
      options,
    });
  };
};
