import { IndexDefinition, IndexOptions } from 'mongoose';
import { PropOptions } from '../prop.decorator';
import { SchemaOptions } from '../schema.decorator';

export interface PropertyMetadata {
  target: Function;
  propertyKey: string;
  options: PropOptions;
}

export interface ExtendedSchemaOptions extends SchemaOptions {
  index?: {
    fields: IndexDefinition;
    options?: IndexOptions;
  };
}

export interface SchemaMetadata {
  target: Function;
  options?: ExtendedSchemaOptions;
  properties?: PropertyMetadata[];
}
