import { GenericError } from './generic.error';

export class BadRequestError extends GenericError {
  constructor(message = 'Bad Request') {
    super(400, message);
    this.name = 'BadRequestError';
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}
