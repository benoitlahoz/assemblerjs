import { ClassConstructor } from 'class-transformer';
import { buildDecoratorParameterKey } from '@assemblerjs/common';
import { createDto, DtoValidationOptions } from './dto-factory';

const BODY_METADATA_KEY = buildDecoratorParameterKey('body');

const firstIndexFromRecord = (record?: Record<string, unknown>): number | undefined => {
  if (!record) return undefined;

  const indexes = Object.keys(record)
    .map((key) => Number(key))
    .filter((index) => Number.isFinite(index))
    .sort((a, b) => a - b);

  return indexes.length > 0 ? indexes[0] : undefined;
};

const resolveBodyIndex = (
  target: object,
  propertyKey: string | symbol,
  explicitIndex?: number
): number => {
  if (typeof explicitIndex === 'number') {
    return explicitIndex;
  }

  // fetch metadata is stored on the method function itself.
  const methodFn = (target as any)[String(propertyKey)];
  if (methodFn) {
    const bodyMetadata = Reflect.getMetadata(
      BODY_METADATA_KEY,
      methodFn
    ) as Record<string, unknown> | undefined;
    const bodyIndex = firstIndexFromRecord(bodyMetadata);
    if (typeof bodyIndex === 'number') {
      return bodyIndex;
    }
  }

  // Default fallback.
  return 0;
};

export const ValidateArg = <T extends object>(
  index: number,
  dtoClass: ClassConstructor<T>,
  options?: DtoValidationOptions
): MethodDecorator => {
  return (
    _target: object,
    _propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>
  ) => {
    const original = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      args[index] = await createDto(dtoClass, args[index] as object, true, options);
      return original.apply(this, args);
    };

    return descriptor;
  };
};

export const ValidateBody = <T extends object>(
  dtoClass: ClassConstructor<T>,
  options?: DtoValidationOptions,
  index?: number
): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>
  ) => {
    const original = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const resolvedIndex = resolveBodyIndex(target, propertyKey, index);
      args[resolvedIndex] = await createDto(
        dtoClass,
        args[resolvedIndex] as object,
        true,
        options
      );

      return original.apply(this, args);
    };

    return descriptor;
  };
};
