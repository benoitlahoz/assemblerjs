import 'reflect-metadata';
import mongoose from 'mongoose';
import { forOf } from '@assemblerjs/core';
import { TypeMetadataStorage } from '../storages/type-metadata.storage';
import { DefinitionsFactory } from './definitions.factory';

export class SchemaFactory {
  /**
   * Create a mongoose `Schema`.
   *
   * @param { TClass } target The model's class.
   * @returns { Schema<TClass> } A new `Schema` for the class.
   *
   * @see https://medium.com/nerd-for-tech/js-decorators-for-mongoose-model-from-scratch-cc329a36d412
   */
  public static createForClass<TClass = any>(
    target: Function
  ): mongoose.Schema<TClass> {
    const schemaDefinition = DefinitionsFactory.createForClass(target);
    const schemaMetadata =
      TypeMetadataStorage.getSchemaMetadataByTarget(target);
    const schemaOpts = schemaMetadata?.options;

    const schema = new mongoose.Schema<TClass>(
      schemaDefinition as mongoose.SchemaDefinition<
        mongoose.SchemaDefinitionType<TClass>
      >,
      schemaOpts as mongoose.SchemaOptions<any>
    );

    if (schemaOpts?.plugins && Array.isArray(schemaOpts.plugins)) {
      // TODO: Correct type.
      forOf(schemaOpts.plugins)((definition: any) => {
        schema.plugin(definition.package, definition.options);
      });
    }

    return schema;
  }
}
