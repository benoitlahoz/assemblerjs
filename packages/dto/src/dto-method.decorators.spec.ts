import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { IsInt, IsString } from 'class-validator';
import { AdaptArg, AdaptBody, ValidateArg, ValidateBody } from './dto-method.decorators';
import { DtoValidationError } from './dto-validation-error';

const BODY_METADATA_KEY = 'assemblerjs:param:body';

class CreateUserDto {
  @IsString()
  name: string;

  @IsInt()
  age: number;
}

class ExternalUserDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsInt()
  age: number;
}

class DomainUserDto {
  @IsString()
  fullName: string;

  @IsInt()
  age: number;
}

class UserService {
  @ValidateArg(0, CreateUserDto)
  async create(input: CreateUserDto) {
    return input;
  }

  @ValidateBody(CreateUserDto)
  async createFromBody(body: CreateUserDto, traceId: string) {
    return { body, traceId };
  }

  @ValidateBody(CreateUserDto)
  async createFromBodyAtIndexOne(traceId: string, body: CreateUserDto) {
    return { body, traceId };
  }

  @ValidateBody(CreateUserDto, undefined, 1)
  async createFromBodyWithExplicitIndex(traceId: string, body: CreateUserDto) {
    return { body, traceId };
  }

  @AdaptArg(0, ExternalUserDto, DomainUserDto, (source) => ({
    fullName: `${source.firstName} ${source.lastName}`,
    age: source.age,
  }))
  async createFromAdapted(input: DomainUserDto, traceId: string) {
    return { input, traceId };
  }

  @AdaptArg(0, ExternalUserDto, DomainUserDto, async (source) => ({
    fullName: `${source.firstName} ${source.lastName}`,
    age: source.age,
  }))
  async createFromAdaptedAsync(input: DomainUserDto) {
    return input;
  }

  @AdaptArg(0, ExternalUserDto, DomainUserDto, () => {
    throw new Error('mapping exploded');
  })
  async createWithMapperFailure(input: DomainUserDto) {
    return input;
  }

  @AdaptArg(0, ExternalUserDto, DomainUserDto, (source) => ({
    fullName: `${source.firstName} ${source.lastName}`,
    age: 'wrong-type' as any,
  }))
  async createWithInvalidMappedTarget(input: DomainUserDto) {
    return input;
  }

  @AdaptBody(ExternalUserDto, DomainUserDto, (source) => ({
    fullName: `${source.firstName} ${source.lastName}`,
    age: source.age,
  }))
  async createFromAdaptedBody(body: DomainUserDto, traceId: string) {
    return { body, traceId };
  }

  @AdaptBody(ExternalUserDto, DomainUserDto, (source) => ({
    fullName: `${source.firstName} ${source.lastName}`,
    age: source.age,
  }))
  async createFromAdaptedBodyAtIndexOne(traceId: string, body: DomainUserDto) {
    return { body, traceId };
  }

  @AdaptBody(
    ExternalUserDto,
    DomainUserDto,
    (source) => ({
      fullName: `${source.firstName} ${source.lastName}`,
      age: source.age,
    }),
    undefined,
    1
  )
  async createFromAdaptedBodyWithExplicitIndex(
    traceId: string,
    body: DomainUserDto
  ) {
    return { body, traceId };
  }

  @AdaptBody(ExternalUserDto, DomainUserDto, () => {
    throw new Error('body mapping exploded');
  })
  async createFromAdaptedBodyWithMapperFailure(body: DomainUserDto) {
    return body;
  }
}

describe('dto method decorators', () => {
  // Simulate metadata produced by @Body decorators.
  Reflect.defineMetadata(
    BODY_METADATA_KEY,
    { '1': 'body' },
    UserService.prototype.createFromBodyAtIndexOne
  );

  Reflect.defineMetadata(
    BODY_METADATA_KEY,
    { '1': 'body' },
    UserService.prototype.createFromAdaptedBodyAtIndexOne
  );

  it('ValidateArg should validate and transform argument before method call', async () => {
    const service = new UserService();
    const result = await service.create({ name: 'Alice', age: 30 } as any);

    expect(result).toBeInstanceOf(CreateUserDto);
    expect(result.name).toBe('Alice');
    expect(result.age).toBe(30);
  });

  it('ValidateArg should throw DtoValidationError on invalid argument', async () => {
    const service = new UserService();

    await expect(service.create({ name: 'Alice', age: 'invalid' } as any)).rejects.toBeInstanceOf(
      DtoValidationError
    );
  });

  it('ValidateBody should validate first argument and preserve remaining args', async () => {
    const service = new UserService();
    const result = await service.createFromBody(
      { name: 'Bob', age: 22 } as any,
      'trace-1'
    );

    expect(result.body).toBeInstanceOf(CreateUserDto);
    expect(result.body.name).toBe('Bob');
    expect(result.traceId).toBe('trace-1');
  });

  it('ValidateBody should resolve body index from @Body metadata', async () => {
    const service = new UserService();
    const result = await service.createFromBodyAtIndexOne(
      'trace-2',
      { name: 'Carl', age: 19 } as any
    );

    expect(result.body).toBeInstanceOf(CreateUserDto);
    expect(result.body.name).toBe('Carl');
    expect(result.traceId).toBe('trace-2');
  });

  it('ValidateBody should support explicit index override', async () => {
    const service = new UserService();
    const result = await service.createFromBodyWithExplicitIndex(
      'trace-3',
      { name: 'Dana', age: 41 } as any
    );

    expect(result.body).toBeInstanceOf(CreateUserDto);
    expect(result.body.name).toBe('Dana');
    expect(result.traceId).toBe('trace-3');
  });

  it('AdaptArg should validate source, map to target and preserve other args', async () => {
    const service = new UserService();
    const result = await service.createFromAdapted(
      { firstName: 'Jane', lastName: 'Doe', age: 33 } as any,
      'trace-4'
    );

    expect(result.input).toBeInstanceOf(DomainUserDto);
    expect(result.input.fullName).toBe('Jane Doe');
    expect(result.input.age).toBe(33);
    expect(result.traceId).toBe('trace-4');
  });

  it('AdaptArg should support async mapper', async () => {
    const service = new UserService();
    const result = await service.createFromAdaptedAsync(
      { firstName: 'John', lastName: 'Smith', age: 25 } as any
    );

    expect(result).toBeInstanceOf(DomainUserDto);
    expect(result.fullName).toBe('John Smith');
    expect(result.age).toBe(25);
  });

  it('AdaptArg should throw DtoValidationError when source is invalid', async () => {
    const service = new UserService();

    await expect(
      service.createFromAdapted({ firstName: 'Only', age: 25 } as any, 'trace-5')
    ).rejects.toBeInstanceOf(DtoValidationError);
  });

  it('AdaptArg should throw explicit error when mapper fails', async () => {
    const service = new UserService();

    await expect(
      service.createWithMapperFailure({ firstName: 'A', lastName: 'B', age: 20 } as any)
    ).rejects.toThrow('AdaptArg mapper failed at index 0: mapping exploded');
  });

  it('AdaptArg should throw DtoValidationError when mapped target is invalid', async () => {
    const service = new UserService();

    await expect(
      service.createWithInvalidMappedTarget({ firstName: 'A', lastName: 'B', age: 20 } as any)
    ).rejects.toBeInstanceOf(DtoValidationError);
  });

  it('AdaptBody should adapt body at default index 0', async () => {
    const service = new UserService();
    const result = await service.createFromAdaptedBody(
      { firstName: 'Body', lastName: 'Default', age: 31 } as any,
      'trace-6'
    );

    expect(result.body).toBeInstanceOf(DomainUserDto);
    expect(result.body.fullName).toBe('Body Default');
    expect(result.body.age).toBe(31);
    expect(result.traceId).toBe('trace-6');
  });

  it('AdaptBody should resolve body index from @Body metadata', async () => {
    const service = new UserService();
    const result = await service.createFromAdaptedBodyAtIndexOne(
      'trace-7',
      { firstName: 'Meta', lastName: 'Index', age: 29 } as any
    );

    expect(result.body).toBeInstanceOf(DomainUserDto);
    expect(result.body.fullName).toBe('Meta Index');
    expect(result.body.age).toBe(29);
    expect(result.traceId).toBe('trace-7');
  });

  it('AdaptBody should support explicit index override', async () => {
    const service = new UserService();
    const result = await service.createFromAdaptedBodyWithExplicitIndex(
      'trace-8',
      { firstName: 'Explicit', lastName: 'Index', age: 44 } as any
    );

    expect(result.body).toBeInstanceOf(DomainUserDto);
    expect(result.body.fullName).toBe('Explicit Index');
    expect(result.body.age).toBe(44);
    expect(result.traceId).toBe('trace-8');
  });

  it('AdaptBody should throw explicit error when mapper fails', async () => {
    const service = new UserService();

    await expect(
      service.createFromAdaptedBodyWithMapperFailure(
        { firstName: 'A', lastName: 'B', age: 20 } as any
      )
    ).rejects.toThrow('AdaptBody mapper failed at index 0: body mapping exploded');
  });
});
