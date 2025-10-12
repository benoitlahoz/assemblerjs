import 'reflect-metadata';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance, ClassConstructor } from 'class-transformer';
import { DtoValidationError } from './dto-validation-error';

/**
 * A helper class to create and validate DTOs generically.
 */
export class DtoFactory {
  /**
   * Create a validated instance of the given DTO class from plain input.
   * @param dtoClass The DTO class (with validation decorators)
   * @param input The plain object to instantiate and validate
   * @returns The validated instance, or throws if validation fails
   */
  public static async create<T extends object>(
    dtoClass: ClassConstructor<T>,
    input: object,
    parseErrors = true
  ): Promise<T> {
    const dto = plainToInstance(dtoClass, input);
    const errors: ValidationError[] = await validate(dto);
    if (errors.length > 0) {
      if (parseErrors) {
        throw new DtoValidationError(DtoFactory.parseValidationErrors(errors));
      }

      throw errors;
    }

    return dto;
  }

  /**
   * Parse an array of ValidationError objects into a single error message string.
   * @param errors The array of ValidationError objects
   * @returns A single error message string
   */
  public static parseValidationErrors(errors: ValidationError[]): string {
    const flattenErrors = (
      errs: ValidationError[],
      parent?: string
    ): string[] => {
      return errs.flatMap((error) => {
        const propertyPath = parent
          ? `${parent}.${error.property}`
          : error.property;
        const constraints = error.constraints
          ? Object.values(error.constraints)
          : [];
        const children =
          error.children && error.children.length > 0
            ? flattenErrors(error.children, propertyPath)
            : [];
        return [...constraints, ...children];
      });
    };

    return flattenErrors(errors).join('; ');
  }
}
