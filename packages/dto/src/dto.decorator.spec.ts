import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { IsString, IsInt } from 'class-validator';
import { Dto } from './dto.decorator';
import { DtoMetadataKeys } from './dto.reflection';
import { DtoFactory } from './dto-factory';

@Dto()
class UserDto {
  @IsString()
  name: string;

  @IsInt()
  age: number;
}

// Fake @Body decorator to extract the request body.
function Body() {
  return (target: any, propertyKey: string, parameterIndex: number) => {
    const existingBodyParameters: number[] =
      Reflect.getMetadata('body:parameters', target, propertyKey) || [];
    existingBodyParameters.push(parameterIndex);
    Reflect.defineMetadata(
      'body:parameters',
      existingBodyParameters,
      target,
      propertyKey
    );
  };
}

// Fake @Post decorator to simulate a POST request that validates the request body if parameter is of DTO type.
function FakePost() {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const bodyParameters: number[] =
        Reflect.getMetadata('body:parameters', target, propertyKey) || [];

      for (const index of bodyParameters) {
        let obj = args[index];
        if (!obj) {
          throw new Error(
            `Missing object at parameter index ${index} in method ${propertyKey}`
          );
        }

        // Get parameter type.
        const paramTypes = Reflect.getMetadata(
          'design:paramtypes',
          target,
          propertyKey
        );
        const expectedType = paramTypes[index];

        if (obj.constructor.name !== expectedType.name) {
          throw new Error(
            `Object type mismatch at parameter index ${index} in method ${propertyKey}`
          ).message;
        }

        if (!Reflect.getMetadata(DtoMetadataKeys.IsDto, obj.constructor)) {
          return obj;
        }

        await DtoFactory.create(obj.constructor, obj);
      }

      return originalMethod.apply(this, args);
    };
  };
}

class FakeController {
  @FakePost()
  async createUser(@Body() userDto: UserDto) {
    expect(userDto).toBeInstanceOf(UserDto);
    expect(userDto.name).toBe('John');
    expect(userDto.age).toBe(30);
  }

  @FakePost()
  async createAnyUser(@Body() userNotDto: any) {
    expect(userNotDto).not.toBeInstanceOf(UserDto);
    expect(userNotDto.name).toBe('John');
    expect(userNotDto.age).toBe(30);
  }
}

describe('Dto Decorator', () => {
  it('should mark the class as a DTO', () => {
    expect(Reflect.getMetadata(DtoMetadataKeys.IsDto, UserDto)).toBe(true);
  });

  it('should validate DTOs in class methods', async () => {
    const dtoUsage = new FakeController();
    const userDto = new UserDto();
    userDto.name = 'John';
    userDto.age = 30;

    await expect(dtoUsage.createUser(userDto)).resolves.not.toThrow();
  });

  it('should pass validation when object is not a DTO in a method that accepts any object.', async () => {
    const dtoUsage = new FakeController();
    const notADto = { name: 'John', age: 30 };

    // UserDto was not used but no validation is performed in the method that accepts any object.
    await expect(dtoUsage.createAnyUser(notADto)).resolves.not.toThrow();
  });

  it('should throw an error for missing DTOs in class methods', async () => {
    const dtoUsage = new FakeController();

    await expect(dtoUsage.createUser(undefined as any)).rejects.toThrow();
  });

  it('should parse validation errors into a user-friendly message', async () => {
    const dtoUsage = new FakeController();
    const invalidNotADto = { name: 'John', age: 'thirty' };

    try {
      await dtoUsage.createUser(invalidNotADto as any);
    } catch (error) {
      // UserDto was not used but was expected.
      expect(error).toContain('Object type mismatch at parameter');
    }
  });
});
