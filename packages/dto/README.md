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
- 🔁 **Pre-call method decorators** - Validate or adapt arguments before the method executes

## Public API

All exports are re-exported from `src/index.ts`.

- `Dto()` - marks a class as a DTO
- `createDto()` - validate and transform a plain object into a DTO instance
- `createDtoSafe()` - non-throwing DTO creation helper that returns structured issues
- `ValidateArg(index, DtoClass, options?)` - validate and replace a method argument
- `ValidateBody(DtoClass, options?, index?)` - resolve and validate the body argument
- `AdaptArg(index, SourceDto, TargetDto, mapper, options?)` - validate, adapt, then validate again
- `AdaptBody(SourceDto, TargetDto, mapper, options?, index?)` - body-oriented alias for `AdaptArg`
- `DtoValidationHooks` - optional lifecycle hooks for validation (`start/success/failure`)
- `DtoDecoratorHooks` - optional lifecycle hooks for decorator adaptation (`start/success/failure`)
- `DtoValidationError` - validation error with a status code
- `DtoMetadataKeys` - DTO metadata keys used by `@Dto()`
- `DtoSchemaExtractor` - derive JSON schema from class-validator metadata

## Validation Options (Normalized)

`createDto` supports a normalized options object:

```typescript
await createDto(CreateUserDto, payload, {
  parseErrors: true,
  validation: {
    whitelist: true,
    forbidNonWhitelisted: true,
    groups: ['create'],
  },
});
```

Decorator helpers (`ValidateArg`, `ValidateBody`, `AdaptArg`, `AdaptBody`) internally use the same normalized flow with `parseErrors: true`.

You can plug optional hooks for observability:

```typescript
await createDto(CreateUserDto, payload, {
  parseErrors: true,
  hooks: {
    onValidateStart: ({ dtoName }) => console.log('start', dtoName),
    onValidateSuccess: ({ dtoName }) => console.log('success', dtoName),
    onValidateFailure: ({ dtoName, issues }) => console.log('failure', dtoName, issues),
  },
});
```

Decorator-level adaptation hooks are also supported through decorator options:

```typescript
@AdaptArg(0, ExternalDto, DomainDto, mapper, {
  hooks: {
    onAdaptStart: ({ methodName }) => console.log('adapt start', methodName),
    onAdaptSuccess: ({ methodName }) => console.log('adapt success', methodName),
    onAdaptFailure: ({ methodName, error }) => console.log('adapt failure', methodName, error),
  },
})
```

## ValidationIssue Contract

`createDtoSafe` returns issues with a stable shape:

```typescript
type ValidationIssue = {
  path: string;
  code: string;
  message: string;
  value?: unknown;
  context?: Record<string, unknown>;
};
```

`context` is populated from `class-validator` decorator `context` metadata when available.

## Decorator Metadata Convention

`@assemblerjs/dto` uses the shared metadata key convention from `@assemblerjs/common` when resolving bodies for method decorators:

- `assemblerjs:param:body`

This keeps DTO method decorators interoperable with `@assemblerjs/fetch` and `@assemblerjs/rest`.

## Installation

```bash
npm install @assemblerjs/dto class-validator class-transformer reflect-metadata
# or
yarn add @assemblerjs/dto class-validator class-transformer reflect-metadata
```

## Quick Start

```typescript
import 'reflect-metadata';
import { Dto } from '@assemblerjs/dto';
import { IsString, IsEmail, IsInt, Min, Max } from 'class-validator';

@Dto()
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

### `@Dto()` Decorator

Marks a class as a DTO and enables validation.

```typescript
@Dto()
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

@Dto()
class AddressDto {
  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  @IsOptional()
  zipCode?: string;
}

@Dto()
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
import { Dto } from '@assemblerjs/dto';

@Dto()
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

## OpenAPI Integration

`@assemblerjs/dto` works natively with `@assemblerjs/openapi`. Annotating a DTO class with `@Dto()` registers its `class-validator` metadata so that `DtoSchemaExtractor` can produce a JSON Schema at spec generation time.

```typescript
import { Dto } from '@assemblerjs/dto';
import { IsString, IsInt, IsEmail, IsOptional } from 'class-validator';
import { Returns } from '@assemblerjs/openapi';

@Dto()
class UserDto {
  @IsInt() id!: number;
  @IsString() name!: string;
  @IsEmail() @IsOptional() email?: string;
}

// In a REST controller:
@Returns(200, UserDto, 'A single user')
@Get('/:id')
getOne(@Param('id') id: string) { ... }
```

The `UserDto` schema will be emitted under `components/schemas/UserDto` and referenced via `$ref` in the response object. See [`@assemblerjs/openapi`](../openapi/README.md) for full details.

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

### E2E coverage

The package includes a full end-to-end scenario under `e2e/` that uses both `@assemblerjs/rest` and `@assemblerjs/fetch`.

- Main scenario: `e2e/dto-package.full-e2e.spec.ts`
- Fixtures: `e2e/fixtures/`
- Generated logs: `e2e/logs/dto-e2e.md`

## License

MIT

---

Part of the [AssemblerJS monorepo](../../README.md)
