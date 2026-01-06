import { Transversal, Before, AbstractTransversal, type AdviceContext } from '../../../src';

/**
 * Validation transversal with high priority
 */
@Transversal()
export class ValidationTransversal implements AbstractTransversal {
  public validations: string[] = [];

  onInit() {
    this.validations = [];
  }

  @Before('execution(UserService.create)', 100)
  validateCreate(context: AdviceContext) {
    this.validations.push('validateCreate');
    const [data] = context.args;
    if (!data || !data.name) {
      throw new Error('Validation failed: name is required');
    }
    if (!data.email) {
      throw new Error('Validation failed: email is required');
    }
  }

  @Before('execution(UserService.update)', 100)
  validateUpdate(context: AdviceContext) {
    this.validations.push('validateUpdate');
    const [id, data] = context.args;
    if (!id) {
      throw new Error('Validation failed: id is required');
    }
    if (!data) {
      throw new Error('Validation failed: data is required');
    }
  }
}
