import 'reflect-metadata';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance, ClassConstructor } from 'class-transformer';
import { DtoValidationError } from './dto-validation-error';

export interface DtoValidationOptions {
  whitelist?: boolean;
  forbidNonWhitelisted?: boolean;
  skipMissingProperties?: boolean;
  groups?: string[];
}

export interface ValidationIssue {
  path: string;
  code: string;
  message: string;
  value?: unknown;
}

export type DtoSafeResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: DtoValidationError; issues: ValidationIssue[] };

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
    parseErrors = true,
    options?: DtoValidationOptions
  ): Promise<T> {
    const dto = plainToInstance(dtoClass, input);
    const errors: ValidationError[] = await validate(dto, options);
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

  public static parseValidationIssues(errors: ValidationError[]): ValidationIssue[] {
    const flattenIssues = (
      errs: ValidationError[],
      parentPath?: string
    ): ValidationIssue[] => {
      return errs.flatMap((error) => {
        const currentPath = parentPath
          ? `${parentPath}.${error.property}`
          : error.property;

        const constraintIssues = error.constraints
          ? Object.entries(error.constraints).map(([code, message]) => ({
              path: currentPath,
              code,
              message,
              value: error.value,
            }))
          : [];

        const childIssues =
          error.children && error.children.length > 0
            ? flattenIssues(error.children, currentPath)
            : [];

        return [...constraintIssues, ...childIssues];
      });
    };

    return flattenIssues(errors);
  }
}

export const createDto = async <T extends object>(
  dtoClass: ClassConstructor<T>,
  input: object,
  parseErrors = true,
  options?: DtoValidationOptions
): Promise<T> => {
  return DtoFactory.create(dtoClass, input, parseErrors, options);
};

export const createDtoSafe = async <T extends object>(
  dtoClass: ClassConstructor<T>,
  input: unknown,
  options?: DtoValidationOptions
): Promise<DtoSafeResult<T>> => {
  try {
    const data = await DtoFactory.create(
      dtoClass,
      (input ?? {}) as object,
      false,
      options
    );

    return { ok: true, data };
  } catch (error) {
    if (Array.isArray(error)) {
      const issues = DtoFactory.parseValidationIssues(error as ValidationError[]);
      const parsedMessage = DtoFactory.parseValidationErrors(error as ValidationError[]);

      return {
        ok: false,
        error: new DtoValidationError(parsedMessage),
        issues,
      };
    }

    throw error;
  }
};
