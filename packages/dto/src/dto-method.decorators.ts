import { ClassConstructor } from 'class-transformer';
import { createDto, DtoValidationOptions } from './dto-factory';

const FETCH_BODY_METADATA_KEY = 'fetch:body.decorator';
const REST_PARAMETERS_METADATA_KEY = 'parameters';
const REST_BODY_METADATA_KEY = 'body';

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
    const fetchMetadata = Reflect.getMetadata(
      FETCH_BODY_METADATA_KEY,
      methodFn
    ) as Record<string, unknown> | undefined;
    const fetchIndex = firstIndexFromRecord(fetchMetadata);
    if (typeof fetchIndex === 'number') {
      return fetchIndex;
    }
  }

  // rest metadata is stored in controller-level "parameters" metadata.
  const restMetadata = Reflect.getMetadata(
    REST_PARAMETERS_METADATA_KEY,
    target
  ) as Record<string, Record<string, Record<string, unknown>>> | undefined;

  const handlerName = String(propertyKey);
  const restBodyMetadata = restMetadata?.[REST_BODY_METADATA_KEY]?.[handlerName];
  const restIndex = firstIndexFromRecord(restBodyMetadata);
  if (typeof restIndex === 'number') {
    return restIndex;
  }

  // Backward-compatible fallback.
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
