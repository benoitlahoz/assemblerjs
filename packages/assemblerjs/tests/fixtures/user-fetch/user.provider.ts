import { AbstractAssemblage, Assemblage, Use } from '../../../src';

@Assemblage()
export class UserProvider implements AbstractAssemblage {
  constructor(
    @Use('fetch') private fetcher: typeof fetch,
    @Use('api') private api: string
  ) {}

  public async getUsers() {
    const res = await this.fetcher(`${this.api}/users`);
    return (await res.json())['users'];
  }

  public async getUserById(id: string) {
    const res = await this.fetcher(`${this.api}/users/${id}`);
    return await res.json();
  }
}
