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

export type DtoValidationHookContext = {
  dtoName: string;
  input: object;
  options: DtoValidationOptions;
};

export type DtoValidationSuccessHookContext = DtoValidationHookContext & {
  output: object;
};

export type DtoValidationFailureHookContext = DtoValidationHookContext & {
  error: unknown;
  issues?: ValidationIssue[];
};

export interface DtoValidationHooks {
  onValidateStart?: (context: DtoValidationHookContext) => void;
  onValidateSuccess?: (context: DtoValidationSuccessHookContext) => void;
  onValidateFailure?: (context: DtoValidationFailureHookContext) => void;
}

export interface DtoCreateOptions {
  parseErrors?: boolean;
  validation?: DtoValidationOptions;
  hooks?: DtoValidationHooks;
}

export interface ValidationIssue {
  path: string;
  code: string;
  message: string;
  value?: unknown;
  context?: Record<string, unknown>;
}

export type DtoSafeResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: DtoValidationError; issues: ValidationIssue[] };

/**
 * A helper class to create and validate DTOs generically.
 */
export class DtoFactory {
  private static resolveCreateOptions(
    parseErrorsOrOptions?: boolean | DtoCreateOptions,
    validationOptions?: DtoValidationOptions
  ): Required<DtoCreateOptions> {
    if (typeof parseErrorsOrOptions === 'boolean') {
      return {
        parseErrors: parseErrorsOrOptions,
        validation: validationOptions ?? {},
        hooks: {},
      };
    }

    return {
      parseErrors: parseErrorsOrOptions?.parseErrors ?? true,
      validation: parseErrorsOrOptions?.validation ?? validationOptions ?? {},
      hooks: parseErrorsOrOptions?.hooks ?? {},
    };
  }

  /**
   * Create a validated instance of the given DTO class from plain input.
   * @param dtoClass The DTO class (with validation decorators)
   * @param input The plain object to instantiate and validate
   * @returns The validated instance, or throws if validation fails
   */
  public static async create<T extends object>(
    dtoClass: ClassConstructor<T>,
    input: object,
    options?: DtoCreateOptions
  ): Promise<T>;

  public static async create<T extends object>(
    dtoClass: ClassConstructor<T>,
    input: object,
    parseErrors?: boolean,
    options?: DtoValidationOptions
  ): Promise<T>;

  public static async create<T extends object>(
    dtoClass: ClassConstructor<T>,
    input: object,
    parseErrorsOrOptions: boolean | DtoCreateOptions = true,
    options?: DtoValidationOptions
  ): Promise<T> {
    const resolved = DtoFactory.resolveCreateOptions(
      parseErrorsOrOptions,
      options
    );

    const dtoName = dtoClass.name || 'AnonymousDto';
    resolved.hooks.onValidateStart?.({
      dtoName,
      input,
      options: resolved.validation,
    });

    const dto = plainToInstance(dtoClass, input);
    const errors: ValidationError[] = await validate(dto, resolved.validation);
    if (errors.length > 0) {
      const issues = DtoFactory.parseValidationIssues(errors);

      if (resolved.parseErrors) {
        const error = new DtoValidationError(DtoFactory.parseValidationErrors(errors));
        resolved.hooks.onValidateFailure?.({
          dtoName,
          input,
          options: resolved.validation,
          error,
          issues,
        });
        throw error;
      }

      resolved.hooks.onValidateFailure?.({
        dtoName,
        input,
        options: resolved.validation,
        error: errors,
        issues,
      });
      throw errors;
    }

    resolved.hooks.onValidateSuccess?.({
      dtoName,
      input,
      options: resolved.validation,
      output: dto,
    });

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
              context:
                error.contexts && typeof error.contexts === 'object'
                  ? ((error.contexts[code] as Record<string, unknown> | undefined) ??
                    undefined)
                  : undefined,
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

export async function createDto<T extends object>(
  dtoClass: ClassConstructor<T>,
  input: object,
  options?: DtoCreateOptions
): Promise<T>;

export async function createDto<T extends object>(
  dtoClass: ClassConstructor<T>,
  input: object,
  parseErrors?: boolean,
  options?: DtoValidationOptions
): Promise<T>;

export async function createDto<T extends object>(
  dtoClass: ClassConstructor<T>,
  input: object,
  parseErrorsOrOptions: boolean | DtoCreateOptions = true,
  options?: DtoValidationOptions
): Promise<T> {
  if (typeof parseErrorsOrOptions === 'boolean') {
    return DtoFactory.create(dtoClass, input, parseErrorsOrOptions, options);
  }

  return DtoFactory.create(dtoClass, input, parseErrorsOrOptions);
}

export const createDtoSafe = async <T extends object>(
  dtoClass: ClassConstructor<T>,
  input: unknown,
  options?: DtoValidationOptions
): Promise<DtoSafeResult<T>> => {
  try {
    const data = await DtoFactory.create(
      dtoClass,
      (input ?? {}) as object,
      {
        parseErrors: false,
        validation: options,
      }
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
