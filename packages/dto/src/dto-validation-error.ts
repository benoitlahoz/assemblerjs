export class DtoValidationError extends Error {
  public readonly status: number;

  constructor(message: string) {
    super(message);
    this.name = 'DtoValidationError';
    this.status = 400;
  }
}
