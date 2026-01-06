import { Assemblage } from '../../../src';
import { AbstractUserService } from './user-service.abstract';

/**
 * User service implementation for testing
 */
@Assemblage()
export class UserService implements AbstractUserService {
  private users: Map<string, any> = new Map();
  private idCounter = 1;

  async findById(id: string): Promise<any> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    return user;
  }

  async findAll(): Promise<any[]> {
    return Array.from(this.users.values());
  }

  async create(data: any): Promise<any> {
    const id = String(this.idCounter++);
    const user = { id, ...data };
    this.users.set(id, user);
    return user;
  }

  async update(id: string, data: any): Promise<any> {
    const user = await this.findById(id);
    const updated = { ...user, ...data };
    this.users.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const exists = this.users.has(id);
    if (!exists) {
      throw new Error(`User with id ${id} not found`);
    }
    this.users.delete(id);
  }

  // Synchronous method for testing
  count(): number {
    return this.users.size;
  }

  // Method for testing specific pointcut
  findByEmail(email: string): any | null {
    return Array.from(this.users.values()).find(u => u.email === email) || null;
  }
}
