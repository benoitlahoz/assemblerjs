import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { Users } from '../../db';

@Assemblage()
export class UserRepository implements AbstractAssemblage {
  public findAll() {
    return Users;
  }

  public findById(id: string) {
    return Users.find((user: any) => user.id === Number(id));
  }

  public findByName(name: string) {
    return Users.find(
      (user: any) => user.name.toLowerCase() === name.toLowerCase()
    );
  }

  public findByGender(gender: string) {
    return Users.filter(
      (user: any) => user.gender.toLowerCase() === gender.toLowerCase()
    );
  }

  public create(user: { name: string; gender: string }) {
    const lastId = Math.max(...Users.map((user: any) => user.id));
    const nextId = lastId + 1;
    const newUser = {
      id: nextId,
      ...user,
    };
    Users.push(newUser);
    return newUser;
  }

  public modify(id: string, user: { name?: string; gender?: string }) {
    const existing = Users.find((u: any) => u.id === Number(id));
    if (existing) {
      const index = Users.indexOf(existing);
      const newUser = {
        ...existing,
        ...user,
      };
      Users.splice(index, 1, newUser);
      return newUser;
    }
    return undefined;
  }

  public replace(id: string, user: { name: string; gender: string }) {
    const existing = Users.find((u: any) => u.id === Number(id));
    if (existing) {
      const index = Users.indexOf(existing);
      const newUser = {
        id: existing.id,
        ...user,
      };
      Users.splice(index, 1, newUser);
      return newUser;
    }
    return undefined;
  }
}
