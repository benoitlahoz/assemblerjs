import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { IsInt, IsString } from 'class-validator';
import { ValidateArg, ValidateBody } from './dto-method.decorators';
import { DtoValidationError } from './dto-validation-error';

class CreateUserDto {
  @IsString()
  name: string;

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
}

describe('dto method decorators', () => {
  // Simulate metadata produced by @Body in fetch and rest packages.
  Reflect.defineMetadata(
    'fetch:body.decorator',
    { '1': 'body' },
    UserService.prototype.createFromBodyAtIndexOne
  );

  Reflect.defineMetadata(
    'parameters',
    {
      body: {
        createFromBodyAtIndexOne: {
          '1': undefined,
        },
      },
    },
    UserService.prototype
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

  it('ValidateBody should resolve body index from fetch/rest @Body metadata', async () => {
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
});
