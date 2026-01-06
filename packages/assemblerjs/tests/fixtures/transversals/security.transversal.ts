import { Transversal, Before, AbstractTransversal, type AdviceContext } from '../../../src';

/**
 * Security transversal for authorization checks
 */
@Transversal()
export class SecurityTransversal implements AbstractTransversal {
  private currentUser: any = null;
  public checks: string[] = [];

  onInit() {
    this.checks = [];
  }

  setCurrentUser(user: any) {
    this.currentUser = user;
  }

  @Before('execution(UserService.delete)', 90)
  checkDeletePermission(context: AdviceContext) {
    this.checks.push('checkDeletePermission');
    if (!this.currentUser) {
      throw new Error('Unauthorized: No user authenticated');
    }
    if (this.currentUser.role !== 'admin') {
      throw new Error('Forbidden: Admin role required');
    }
  }

  @Before('execution(UserService.update)', 90)
  checkUpdatePermission(context: AdviceContext) {
    this.checks.push('checkUpdatePermission');
    if (!this.currentUser) {
      throw new Error('Unauthorized: No user authenticated');
    }
    const [id] = context.args;
    if (this.currentUser.role !== 'admin' && this.currentUser.id !== id) {
      throw new Error('Forbidden: Can only update own profile');
    }
  }
}
