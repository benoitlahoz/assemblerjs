import 'reflect-metadata';
import { getMetadataStorage } from 'class-validator';
import {
  getDtoSchemaHints,
  CustomSchemaBuilder,
} from './custom-validator.helper';

type JsonSchema = {
  type: string;
  properties: Record<string, any>;
  required?: string[];
};

export class DtoSchemaExtractor {
  private static metadataStorage = getMetadataStorage();

  /**
   * Extract OpenAPI-compatible JSON schema from a DTO class
   */
  public static extract(dtoClass: Function): JsonSchema {
    const schema: JsonSchema = {
      type: 'object',
      properties: {},
      required: [],
    };

    const metadatas =
      this.metadataStorage.getTargetValidationMetadatas(
        dtoClass,
        '',
        false,
        false
      );

    const grouped = this.groupByProperty(metadatas);
    const schemaHintsByProperty = getDtoSchemaHints(dtoClass);

    for (const [property, validators] of Object.entries(grouped)) {
      const propertySchema: any = {};

      for (const validator of validators) {
        this.applyValidator(propertySchema, validator);
      }

      this.applyCustomHints(
        propertySchema,
        validators,
        schemaHintsByProperty[property] ?? []
      );

      schema.properties[property] = propertySchema;

      if (!this.isOptional(validators)) {
        schema.required!.push(property);
      }
    }

    if (schema.required!.length === 0) {
      delete schema.required;
    }

    return schema;
  }

  /**
   * Group class-validator metadata by property name
   */
  private static groupByProperty(metadatas: any[]) {
    const grouped: Record<string, any[]> = {};

    for (const meta of metadatas) {
      const prop = meta.propertyName;
      if (!grouped[prop]) grouped[prop] = [];
      grouped[prop].push(meta);
    }

    return grouped;
  }

  /**
   * Map class-validator decorators → OpenAPI schema
   */
  private static applyValidator(schema: any, meta: any) {
    switch (meta.type) {
      case 'isString':
        schema.type = 'string';
        break;

      case 'isInt':
      case 'isNumber':
        schema.type = 'integer';
        break;

      case 'isBoolean':
        schema.type = 'boolean';
        break;

      case 'isEmail':
        schema.type = 'string';
        schema.format = 'email';
        break;

      case 'min':
        schema.minimum = meta.constraints?.[0];
        break;

      case 'max':
        schema.maximum = meta.constraints?.[0];
        break;

      case 'length':
        schema.minLength = meta.constraints?.[0];
        schema.maxLength = meta.constraints?.[1];
        break;

      case 'isArray':
        schema.type = 'array';
        schema.items = schema.items || { type: 'object' };
        break;

      case 'validateNested':
        schema.type = 'object';
        schema.$ref = this.getNestedRef(meta);
        break;

      case 'isOptional':
        schema.__optional = true;
        break;

      default:
        break;
    }
  }

  /**
   * Detect optional fields
   */
  private static isOptional(validators: any[]): boolean {
    return validators.some((v) => v.type === 'isOptional');
  }

  /**
   * Handle nested DTO reference (simple version)
   */
  private static getNestedRef(meta: any): string {
    const target = meta?.target?.name;
    return `#/components/schemas/${target}`;
  }

  private static applyCustomHints(
    schema: any,
    validators: any[],
    hintEntries: Array<{ validatorName: string; schema: CustomSchemaBuilder }>
  ) {
    if (hintEntries.length === 0) {
      return;
    }

    for (const validator of validators) {
      const candidateNames = [validator?.name, validator?.type, validator?.constraintCls?.name]
        .filter((value): value is string => Boolean(value));

      for (const hintEntry of hintEntries) {
        if (!candidateNames.includes(hintEntry.validatorName)) {
          continue;
        }

        const patch =
          typeof hintEntry.schema === 'function'
            ? hintEntry.schema({ constraints: validator?.constraints ?? [] })
            : hintEntry.schema;

        Object.assign(schema, patch);
      }
    }
  }
}