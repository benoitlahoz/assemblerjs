import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { IsString, IsInt } from 'class-validator';
import { DtoFactory } from './dto-factory';

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
});
