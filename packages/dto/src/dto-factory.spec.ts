import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { IsString, IsInt } from 'class-validator';
import { createDto, createDtoSafe, DtoFactory } from './dto-factory';

class UserDto {
  @IsString()
  name: string;

  @IsInt()
  age: number;
}

describe('DtoFactory', () => {
  it('should validate input and return an instance of the DTO class', async () => {
    // Arrange
    const input = { name: 'John', age: 30 };
    const dtoClass = UserDto;

    // Act
    const result = await DtoFactory.create(dtoClass, input);

    // Assert
    expect(result).toBeInstanceOf(dtoClass);
    expect(result.name).toBe(input.name);
    expect(result.age).toBe(input.age);
  });

  it('should throw validation errors for invalid input', async () => {
    // Arrange
    const input = { name: 'John', age: 'thirty' }; // age should be an integer
    const dtoClass = UserDto;

    // Act & Assert
    await expect(DtoFactory.create(dtoClass, input)).rejects.toThrow();
  });

  it('should throw validation errors for missing required fields', async () => {
    // Arrange
    const input = { age: 'thirty' }; // name is missing and age is invalid
    const dtoClass = UserDto;

    // Act & Assert
    await expect(DtoFactory.create(dtoClass, input)).rejects.toThrow();
  });

  it('should parse validation errors into a user-friendly message', async () => {
    // Arrange
    const input = { name: 'John', age: 'thirty' }; // age should be an integer
    const dtoClass = UserDto;

    // Act
    try {
      await DtoFactory.create(dtoClass, input);
    } catch (error) {
      // Assert
      expect((error as any).message).toContain('age must be an integer number');
    }
  });

  it('should handle nested validation errors', async () => {
    // Arrange
    class AddressDto {
      @IsString()
      street: string;

      @IsString()
      city: string;
    }

    class UserWithAddressDto {
      @IsString()
      name: string;

      address: AddressDto;
    }

    const input = { name: 'John', address: { street: '123 Main St' } }; // city is missing
    const dtoClass = UserWithAddressDto;

    // Act
    try {
      await DtoFactory.create(dtoClass, input);
    } catch (error) {
      // Assert
      expect((error as any).message).toContain('city should not be empty');
    }
  });

  it('should handle empty input gracefully', async () => {
    // Arrange
    const input = {};
    const dtoClass = UserDto;

    // Act & Assert
    await expect(DtoFactory.create(dtoClass, input)).rejects.toThrow();
  });

  it('should handle input with extra properties gracefully', async () => {
    // Arrange
    const input = { name: 'John', age: 30, extra: 'value' }; // extra property not defined in DTO
    const dtoClass = UserDto;

    // Act
    const result = await DtoFactory.create(dtoClass, input);

    // Assert
    expect(result).toBeInstanceOf(dtoClass);
    expect(result.name).toBe(input.name);
    expect(result.age).toBe(input.age);
  });

  it('should handle DTOs with no properties', async () => {
    // Arrange
    class EmptyDto {}

    const input = {};
    const dtoClass = EmptyDto;

    try {
      // Act
      await DtoFactory.create(dtoClass, input);
    } catch (error) {
      // Assert
      expect((error as any).message).toContain(
        'an unknown value was passed to the validate function'
      );
    }
  });

  it('should handle multiple errors in a single validation', async () => {
    // Arrange
    class MultiErrorDto {
      @IsString()
      name: string;

      @IsInt()
      age: number;

      @IsString()
      email: string;
    }

    const input = { name: 123, age: 'thirty', email: null }; // All fields invalid
    const dtoClass = MultiErrorDto;

    // Act
    try {
      await DtoFactory.create(dtoClass, input);
    } catch (error) {
      // Assert
      expect((error as any).message).toContain('name must be a string');
      expect((error as any).message).toContain('age must be an integer number');
      expect((error as any).message).toContain('email must be a string');
    }
  });

  it('should throw an array of validation errors when create is called with parseErrors set to false', async () => {
    // Arrange
    const input = { name: 'John', age: 'thirty' }; // age should be an integer
    const dtoClass = UserDto;

    // Act
    try {
      await DtoFactory.create(dtoClass, input, false);
    } catch (error) {
      expect(error).toBeInstanceOf(Array);
    }
  });

  it('should expose createDto alias with same behavior as DtoFactory.create', async () => {
    const input = { name: 'Jane', age: 28 };
    const dto = await createDto(UserDto, input);

    expect(dto).toBeInstanceOf(UserDto);
    expect(dto.name).toBe('Jane');
    expect(dto.age).toBe(28);
  });

  it('should support normalized createDto options object', async () => {
    const input = { name: 'Mark', age: 34 };
    const dto = await createDto(UserDto, input, {
      parseErrors: true,
      validation: {
        whitelist: true,
      },
    });

    expect(dto).toBeInstanceOf(UserDto);
    expect(dto.name).toBe('Mark');
    expect(dto.age).toBe(34);
  });

  it('should expose validation issue context when class-validator context is defined', async () => {
    class ContextDto {
      @IsString({
        context: {
          rule: 'name-string',
          severity: 'error',
        },
      })
      name: string;
    }

    const result = await createDtoSafe(ContextDto, { name: 123 });
    expect(result.ok).toBe(false);

    if (!result.ok) {
      const issue = result.issues.find((entry) => entry.code === 'isString');
      expect(issue).toBeDefined();
      expect(issue?.context).toEqual({
        rule: 'name-string',
        severity: 'error',
      });
    }
  });

  it('should return ok=true with data for createDtoSafe on valid input', async () => {
    const input = { name: 'John', age: 31 };
    const result = await createDtoSafe(UserDto, input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBeInstanceOf(UserDto);
      expect(result.data.name).toBe('John');
      expect(result.data.age).toBe(31);
    }
  });

  it('should return ok=false with issues for createDtoSafe on invalid input', async () => {
    const input = { name: 'John', age: 'thirty' };
    const result = await createDtoSafe(UserDto, input);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.name).toBe('DtoValidationError');
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some((issue) => issue.path.includes('age'))).toBe(true);
      expect(result.issues.some((issue) => issue.code === 'isInt')).toBe(true);
    }
  });

  it('should call validation hooks on success', async () => {
    const calls: string[] = [];
    const dto = await createDto(UserDto, { name: 'Hooks', age: 40 }, {
      parseErrors: true,
      hooks: {
        onValidateStart: () => calls.push('start'),
        onValidateSuccess: () => calls.push('success'),
        onValidateFailure: () => calls.push('failure'),
      },
    });

    expect(dto).toBeInstanceOf(UserDto);
    expect(calls).toEqual(['start', 'success']);
  });

  it('should call validation failure hook on invalid input', async () => {
    const calls: string[] = [];

    await expect(
      createDto(UserDto, { name: 'Hooks', age: 'bad' } as any, {
        parseErrors: true,
        hooks: {
          onValidateStart: () => calls.push('start'),
          onValidateSuccess: () => calls.push('success'),
          onValidateFailure: (context) => {
            calls.push('failure');
            expect(context.dtoName).toBe('UserDto');
            expect(context.issues?.some((issue) => issue.code === 'isInt')).toBe(true);
          },
        },
      })
    ).rejects.toThrow();

    expect(calls).toEqual(['start', 'failure']);
  });
});
