import { GenericError } from './generic.error';

export class InternalServerError extends GenericError {
  constructor(status = 500, message = 'Internal Server Error') {
    super(status, message);
    this.name = 'InternalServerError';
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}
