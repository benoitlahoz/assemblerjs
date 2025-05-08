import { PropOptions } from '../prop.decorator';
import { SchemaOptions } from '../schema.decorator';

export interface PropertyMetadata {
  target: Function;
  propertyKey: string;
  options: PropOptions;
}

export interface SchemaMetadata {
  target: Function;
  options?: SchemaOptions;
  properties?: PropertyMetadata[];
}
