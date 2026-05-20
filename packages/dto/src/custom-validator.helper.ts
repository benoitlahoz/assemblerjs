import 'reflect-metadata';
import {
  registerDecorator,
  ValidatorConstraint,
  ValidationArguments,
  ValidatorConstraintInterface,
  ValidationOptions,
} from 'class-validator';

export type CustomSchemaBuilderContext = {
  constraints: unknown[];
};

export type CustomSchemaBuilder =
  | Record<string, unknown>
  | ((context: CustomSchemaBuilderContext) => Record<string, unknown>);

export type CustomValidatorBuilderContext<TConstraints extends unknown[]> = {
  value: unknown;
  constraints: TConstraints;
  args: ValidationArguments;
};

export type CustomValidatorDefinition<TConstraints extends unknown[]> = {
  name: string;
  validate: (
    context: CustomValidatorBuilderContext<TConstraints>
  ) => boolean | Promise<boolean>;
  defaultMessage?: (context: {
    constraints: TConstraints;
    args: ValidationArguments;
  }) => string;
  async?: boolean;
  schema?: CustomSchemaBuilder;
};

type SchemaHintEntry = {
  validatorName: string;
  schema: CustomSchemaBuilder;
};

const DTO_SCHEMA_HINTS_METADATA_KEY = 'assemblerjs:dto:schema-hints';

const VALIDATION_OPTIONS_KEYS = new Set([
  'message',
  'groups',
  'always',
  'each',
  'context',
]);

const asValidationOptions = (value: unknown): ValidationOptions | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const entries = Object.keys(value as Record<string, unknown>);
  if (entries.length === 0) {
    return undefined;
  }

  const isValidationOptionsShape = entries.every((key) =>
    VALIDATION_OPTIONS_KEYS.has(key)
  );

  return isValidationOptionsShape ? (value as ValidationOptions) : undefined;
};

const appendSchemaHint = (
  dtoClass: Function,
  propertyName: string,
  hintEntry: SchemaHintEntry
) => {
  const existing =
    (Reflect.getMetadata(
      DTO_SCHEMA_HINTS_METADATA_KEY,
      dtoClass
    ) as Record<string, SchemaHintEntry[]>) ?? {};

  const propertyHints = existing[propertyName] ?? [];
  propertyHints.push(hintEntry);

  Reflect.defineMetadata(
    DTO_SCHEMA_HINTS_METADATA_KEY,
    {
      ...existing,
      [propertyName]: propertyHints,
    },
    dtoClass
  );
};

export const getDtoSchemaHints = (
  dtoClass: Function
): Record<string, SchemaHintEntry[]> => {
  return (
    (Reflect.getMetadata(
      DTO_SCHEMA_HINTS_METADATA_KEY,
      dtoClass
    ) as Record<string, SchemaHintEntry[]>) ?? {}
  );
};

export const createValidatorDecorator = <TConstraints extends unknown[] = []>(
  definition: CustomValidatorDefinition<TConstraints>
) => {
  class RuntimeValidatorConstraint implements ValidatorConstraintInterface {
    validate(value: unknown, args: ValidationArguments): boolean | Promise<boolean> {
      return definition.validate({
        value,
        constraints: args.constraints as TConstraints,
        args,
      });
    }

    defaultMessage(args: ValidationArguments): string {
      if (!definition.defaultMessage) {
        return `${definition.name} validation failed`;
      }

      return definition.defaultMessage({
        constraints: args.constraints as TConstraints,
        args,
      });
    }
  }

  ValidatorConstraint({
    name: definition.name,
    async: definition.async,
  })(RuntimeValidatorConstraint);

  return (...input: [...TConstraints, ValidationOptions?]): PropertyDecorator => {
    const maybeValidationOptions = asValidationOptions(input[input.length - 1]);
    const constraints =
      maybeValidationOptions === undefined
        ? (input as unknown[])
        : (input.slice(0, -1) as unknown[]);

    return (target: object, propertyName: string | symbol) => {
      registerDecorator({
        name: definition.name,
        target: target.constructor,
        propertyName: String(propertyName),
        constraints,
        options: maybeValidationOptions,
        validator: RuntimeValidatorConstraint,
      });

      if (definition.schema) {
        appendSchemaHint(target.constructor, String(propertyName), {
          validatorName: definition.name,
          schema: definition.schema,
        });
      }
    };
  };
};