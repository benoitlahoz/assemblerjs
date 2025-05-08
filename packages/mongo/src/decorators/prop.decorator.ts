/**
 * Addapted from:
 *
 * @see https://medium.com/nerd-for-tech/js-decorators-for-mongoose-model-from-scratch-cc329a36d412
 * @see https://github.com/nestjs/mongoose
 */
import 'reflect-metadata';
import mongoose from 'mongoose';
import { RAW_OBJECT_DEFINITION } from './constants/mongoose.constants';
import { TypeMetadataStorage } from './storages/type-metadata.storage';

const TYPE_METADATA_KEY = 'design:type';

/**
 * An interface that defines available properties for decorator.
 */
export type PropOptions<T = any> =
  | Partial<mongoose.SchemaDefinitionProperty<T>>
  | mongoose.SchemaType;

/**
 * A decorator for mongoose schema properties.
 *
 * @param { PropOptions } options The options for the property.
 */
export const Prop = (options?: PropOptions): PropertyDecorator => {
  return (target: object, propertyKey: string | symbol) => {
    options = (options || {}) as mongoose.SchemaTypeOptions<unknown>;

    const isRawDefinition = options[RAW_OBJECT_DEFINITION];
    if (!options.type && !Array.isArray(options) && !isRawDefinition) {
      const type = Reflect.getMetadata(TYPE_METADATA_KEY, target, propertyKey);

      if (type === Array) {
        options.type = [];
      } else if (type && type !== Object) {
        options.type = type;
      } else {
        throw new Error(
          `Cannot determine type of '${String(propertyKey)}' in '${
            target.constructor?.name
          }'`
        );
      }
    }

    TypeMetadataStorage.addPropertyMetadata({
      target: target.constructor,
      propertyKey: propertyKey as string,
      options: options as PropOptions,
    });
  };
};
