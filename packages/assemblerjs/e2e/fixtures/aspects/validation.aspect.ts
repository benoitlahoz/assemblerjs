import { Aspect, Before, AbstractAspect, type AdviceContext } from '../../../src';

/**
 * Validation aspect with high priority
 */
@Aspect()
export class ValidationAspect extends AbstractAspect {
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
