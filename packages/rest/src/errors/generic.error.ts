export abstract class GenericError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'GenericError';
  }
}
