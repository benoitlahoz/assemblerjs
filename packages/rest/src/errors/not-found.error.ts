import { GenericError } from './generic.error';

export class NotFoundError extends GenericError {
  constructor(message = 'Not Found') {
    super(404, message);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
