import { AbstractAssemblage, Assemblage, Use } from '../../../src';
import { UserController } from './user.controller';
import { UserProvider } from './user.provider';

export interface UserAPIConfiguration {
  api: string;
}

@Assemblage({
  inject: [[UserProvider], [UserController]],
  use: [['fetch', fetch]],
})
export class UserModule implements AbstractAssemblage {
  constructor(
    private controller: UserController,
    @Use('api') private api: UserAPIConfiguration
  ) {}

  public async getAll() {
    return await this.controller.getUsers();
  }

  public async getById(id: number) {
    return await this.controller.getUserById(String(id));
  }
}
