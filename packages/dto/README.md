# @assemblerjs/dto

TypeScript decorators for Data Transfer Object (DTO) validation and transformation using `class-validator` and `class-transformer`.

## Overview

`@assemblerjs/dto` provides a streamlined way to validate and transform DTOs in TypeScript applications. It leverages the power of `class-validator` and `class-transformer` to ensure data integrity and type safety.

## Features

- 🎯 **Type-safe validation** - Full TypeScript support
- 🔄 **Automatic transformation** - Convert plain objects to class instances
- ✅ **Class-validator integration** - Use all class-validator decorators
- 🏭 **Factory pattern** - Create and validate DTOs easily
- 🚨 **Detailed errors** - Custom error class with validation details

## Installation

```bash
npm install @assemblerjs/dto class-validator class-transformer reflect-metadata
# or
yarn add @assemblerjs/dto class-validator class-transformer reflect-metadata
```

## Quick Start

```typescript
import 'reflect-metadata';
import { DTO } from '@assemblerjs/dto';
import { IsString, IsEmail, IsInt, Min, Max } from 'class-validator';

@DTO()
class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsInt()
  @Min(18)
  @Max(120)
  age: number;
}

// Valid data
const validDto = new CreateUserDto();
validDto.name = 'John Doe';
validDto.email = 'john@example.com';
validDto.age = 30;

// Invalid data will throw DtoValidationError
const invalidDto = new CreateUserDto();
invalidDto.name = 'Jane';
invalidDto.email = 'not-an-email'; // Invalid email
invalidDto.age = 15; // Below minimum
```

## API

### `@DTO()` Decorator

Marks a class as a DTO and enables validation.

```typescript
@DTO()
class MyDto {
  @IsString()
  field: string;
}
```

### DTO Factory

Create and validate DTOs from plain objects:

```typescript
import { createDto } from '@assemblerjs/dto';

const plainObject = {
  name: 'John',
  email: 'john@example.com',
  age: 30
};

// Transform and validate
const dto = await createDto(CreateUserDto, plainObject);
```

### Validation Errors

The package provides a custom error class with detailed validation information:

```typescript
import { DtoValidationError } from '@assemblerjs/dto';

try {
  const dto = await createDto(CreateUserDto, invalidData);
} catch (error) {
  if (error instanceof DtoValidationError) {
    console.log(error.message);
    console.log(error.errors); // Array of validation errors
  }
}
```

## Usage with class-validator

You can use all `class-validator` decorators:

```typescript
import {
  IsString,
  IsEmail,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum
} from 'class-validator';
import { Type } from 'class-transformer';

enum Role {
  USER = 'user',
  ADMIN = 'admin'
}

@DTO()
class AddressDto {
  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  @IsOptional()
  zipCode?: string;
}

@DTO()
class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsInt()
  @Min(18)
  @Max(120)
  age: number;

  @IsEnum(Role)
  role: Role;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
```

## Usage with AssemblerJS

Integrate DTOs with AssemblerJS dependency injection:

```typescript
import { Assemblage, AbstractAssemblage } from 'assemblerjs';
import { DTO } from '@assemblerjs/dto';

@DTO()
class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}

@Assemblage()
class UserService implements AbstractAssemblage {
  async updateUser(id: string, data: UpdateUserDto) {
    // Data is already validated
    // Perform update logic
  }
}
```

## Reflection API

Access DTO metadata at runtime:

```typescript
import { getDtoMetadata } from '@assemblerjs/dto';

const metadata = getDtoMetadata(CreateUserDto);
// Use metadata for runtime introspection
```

## Requirements

- **Node.js:** ≥ 18.12.0
- **TypeScript:** ≥ 5.0
- **reflect-metadata:** Required for decorators

## TypeScript Configuration

Enable decorators in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "target": "ES2020",
    "lib": ["ES2020"]
  }
}
```

## For Contributors

### Development

```bash
# Build the package
npx nx build dto

# Run tests
npx nx test dto

# Lint
npx nx lint dto
```

## License

MIT

---

Part of the [AssemblerJS monorepo](../../README.md)
