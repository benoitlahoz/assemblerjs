import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { createDto } from './dto-factory';
import { createValidatorDecorator } from './custom-validator.helper';
import { DtoSchemaExtractor } from './dto-schema-extractor';

const IsPrefixed = createValidatorDecorator<[string]>({
  name: 'isPrefixed',
  validate: ({ value, constraints }) => {
    const [prefix] = constraints;
    return typeof value === 'string' && value.startsWith(prefix);
  },
  defaultMessage: ({ constraints }) => {
    const [prefix] = constraints;
    return `value must start with ${prefix}`;
  },
  schema: ({ constraints }) => {
    const [prefix] = constraints;
    return {
      type: 'string',
      pattern: `^${prefix}`,
    };
  },
});

class CustomValidatedDto {
  @IsPrefixed('usr_')
  id: string;
}

describe('createValidatorDecorator', () => {
  it('should validate DTO values with a custom validator', async () => {
    const dto = await createDto(CustomValidatedDto, { id: 'usr_123' });
    expect(dto.id).toBe('usr_123');
  });

  it('should return validation error when custom validator fails', async () => {
    await expect(createDto(CustomValidatedDto, { id: 'abc_123' })).rejects.toThrow(
      'value must start with usr_'
    );
  });

  it('should expose custom validator schema hints via DtoSchemaExtractor', () => {
    const schema = DtoSchemaExtractor.extract(CustomValidatedDto);
    expect(schema.properties.id.type).toBe('string');
    expect(schema.properties.id.pattern).toBe('^usr_');
  });
});