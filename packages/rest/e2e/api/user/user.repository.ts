import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { Users } from '../../db';

@Assemblage()
export class UserRepository implements AbstractAssemblage {
  public findAll() {
    return Users;
  }

  public findById(id: string) {
    return Users.find((user) => user.id === Number(id));
  }

  public findByGender(gender: string) {
    return Users.filter(
      (user) => user.gender.toLowerCase() === gender.toLowerCase()
    );
  }

  public create(user: { name: string; gender: string }) {
    const lastId = Math.max(...Users.map((u) => u.id));
    const newUser = { id: lastId + 1, ...user };
    Users.push(newUser);
    return newUser;
  }

  public modify(id: string, user: { name?: string; gender?: string }) {
    const existing = Users.find((u) => u.id === Number(id));
    if (!existing) return undefined;
    const index = Users.indexOf(existing);
    const newUser = { ...existing, ...user };
    Users.splice(index, 1, newUser);
    return newUser;
  }
}
