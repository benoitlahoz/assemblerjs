import { GenericError } from './generic.error';

export class ForbiddenError extends GenericError {
  constructor(message = 'Forbidden') {
    super(403, message);
    this.name = 'ForbiddenError';
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}
