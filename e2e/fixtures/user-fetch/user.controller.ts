import { AbstractAssemblage, Assemblage } from '../../../src';
import { UserProvider } from './user.provider';

@Assemblage()
export class UserController implements AbstractAssemblage {
  constructor(private provider: UserProvider) {}

  // TODO @Get, @Post, ... decorators that get provider from a @Provider decorator.
  public async getUsers() {
    return await this.provider.getUsers();
  }

  public async getUserById(id: string) {
    return await this.provider.getUserById(id);
  }
}
