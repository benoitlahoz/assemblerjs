import { AbstractAssemblage } from '../../../src';

/**
 * Abstract user service for dependency injection
 */
export abstract class AbstractUserService implements AbstractAssemblage {
  abstract findById(id: string): Promise<any>;
  abstract findAll(): Promise<any[]>;
  abstract create(data: any): Promise<any>;
  abstract update(id: string, data: any): Promise<any>;
  abstract delete(id: string): Promise<void>;
}
