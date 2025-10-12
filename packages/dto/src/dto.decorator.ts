import { DtoMetadataKeys } from './dto.reflection';

/**
 * Decorator that marks a class as a Data Transfer Object (DTO).
 * @returns A class decorator that marks a class as a DTO (Data Transfer Object).
 */
export const Dto = (): ClassDecorator => {
  return (target: Function) => {
    Reflect.defineMetadata(DtoMetadataKeys.IsDto, true, target);
  };
};
