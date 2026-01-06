import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  Assemblage,
  Assembler,
  AbstractAssemblage,
  Transversal,
  Before,
  AbstractTransversal,
  TransversalManager,
  type AdviceContext,
} from '../src';
import { AbstractUserService, UserService } from './fixtures/transversals';

describe('AOP (Transversals) - Pointcut Patterns', () => {
  beforeEach(() => {
    TransversalManager.resetGlobalState();
  });

  describe('Wildcard patterns', () => {
    it('should match all methods with * wildcard', async () => {
      @Transversal()
      class AllMethodsTransversal implements AbstractTransversal {
        public calls: string[] = [];

        @Before('execution(UserService.*)')
        logAllMethods(context: AdviceContext) {
          this.calls.push(context.methodName);
        }
      }

      @Assemblage({
        inject: [[AbstractUserService, UserService]],
        engage: [[AllMethodsTransversal]],
      })
      class App implements AbstractAssemblage {
        constructor(
          public userService: AbstractUserService,
          public transversal: AllMethodsTransversal
        ) {}
      }

      const app = Assembler.build(App);

      await app.userService.create({ name: 'Alice', email: 'alice@test.com' });
      await app.userService.findAll();
      (app.userService as UserService).count();

      expect(app.transversal.calls).toContain('create');
      expect(app.transversal.calls).toContain('findAll');
      expect(app.transversal.calls).toContain('count');
    });

    it('should match specific method with exact name', async () => {
      @Transversal()
      class CreateOnlyTransversal implements AbstractTransversal {
        public calls: string[] = [];

        @Before('execution(UserService.create)')
        logCreate(context: AdviceContext) {
          this.calls.push(context.methodName);
        }
      }

      @Assemblage({
        inject: [[AbstractUserService, UserService]],
        engage: [[CreateOnlyTransversal]],
      })
      class App implements AbstractAssemblage {
        constructor(
          public userService: AbstractUserService,
          public transversal: CreateOnlyTransversal
        ) {}
      }

      const app = Assembler.build(App);

      await app.userService.create({ name: 'Bob', email: 'bob@test.com' });
      await app.userService.findAll();

      expect(app.transversal.calls).toContain('create');
      expect(app.transversal.calls).not.toContain('findAll');
    });

    it('should match methods starting with pattern', async () => {
      @Transversal()
      class FindMethodsTransversal implements AbstractTransversal {
        public calls: string[] = [];

        @Before('execution(UserService.find*)')
        logFindMethods(context: AdviceContext) {
          this.calls.push(context.methodName);
        }
      }

      @Assemblage({
        inject: [[AbstractUserService, UserService]],
        engage: [[FindMethodsTransversal]],
      })
      class App implements AbstractAssemblage {
        constructor(
          public userService: AbstractUserService,
          public transversal: FindMethodsTransversal
        ) {}
      }

      const app = Assembler.build(App);

      await app.userService.create({
        name: 'Charlie',
        email: 'charlie@test.com',
      });
      await app.userService.findAll();
      (app.userService as UserService).findByEmail('charlie@test.com');

      expect(app.transversal.calls).not.toContain('create');
      expect(app.transversal.calls).toContain('findAll');
      expect(app.transversal.calls).toContain('findByEmail');
    });

    it('should match any class with wildcard', async () => {
      @Transversal()
      @Assemblage()
      class AnyClassTransversal implements AbstractTransversal {
        public calls: string[] = [];

        @Before('execution(*.create)')
        logAnyCreate(context: AdviceContext) {
          this.calls.push(
            `${context.target.constructor.name}.${context.methodName}`
          );
        }
      }

      @Assemblage({
        inject: [[AbstractUserService, UserService]],
        engage: [[AnyClassTransversal]],
      })
      class App implements AbstractAssemblage {
        constructor(
          public userService: AbstractUserService,
          public transversal: AnyClassTransversal
        ) {}
      }

      const app = Assembler.build(App);

      await app.userService.create({ name: 'David', email: 'david@test.com' });

      expect(app.transversal.calls).toContain('UserService.create');
    });
  });

  describe('Multiple pointcuts', () => {
    it('should handle multiple pointcuts on same advice', async () => {
      @Transversal()
      @Assemblage()
      class MultiPointcutTransversal implements AbstractTransversal {
        public calls: string[] = [];

        @Before('execution(UserService.create)')
        @Before('execution(UserService.update)')
        @Before('execution(UserService.delete)')
        logMutations(context: AdviceContext) {
          this.calls.push(context.methodName);
        }
      }

      @Assemblage({
        inject: [[AbstractUserService, UserService]],
        engage: [[MultiPointcutTransversal]],
      })
      class App implements AbstractAssemblage {
        constructor(
          public userService: AbstractUserService,
          public transversal: MultiPointcutTransversal
        ) {}
      }

      const app = Assembler.build(App);

      const user = await app.userService.create({
        name: 'Eve',
        email: 'eve@test.com',
      });
      await app.userService.update(user.id, { name: 'Eva' });
      await app.userService.delete(user.id);
      await app.userService.findAll();

      expect(app.transversal.calls).toContain('create');
      expect(app.transversal.calls).toContain('update');
      expect(app.transversal.calls).toContain('delete');
      expect(app.transversal.calls).not.toContain('findAll');
    });
  });

  describe('Pattern combinations', () => {
    it('should handle complex wildcard patterns', async () => {
      @Transversal()
      @Assemblage()
      class ComplexPatternTransversal implements AbstractTransversal {
        public operations: Array<{ type: string; method: string }> = [];

        @Before('execution(UserService.find*)')
        logReadOps(context: AdviceContext) {
          this.operations.push({ type: 'read', method: context.methodName });
        }

        @Before('execution(UserService.create)')
        @Before('execution(UserService.update)')
        @Before('execution(UserService.delete)')
        logWriteOps(context: AdviceContext) {
          this.operations.push({ type: 'write', method: context.methodName });
        }
      }

      @Assemblage({
        inject: [[AbstractUserService, UserService]],
        engage: [[ComplexPatternTransversal]],
      })
      class App implements AbstractAssemblage {
        constructor(
          public userService: AbstractUserService,
          public transversal: ComplexPatternTransversal
        ) {}
      }

      const app = Assembler.build(App);

      const user = await app.userService.create({
        name: 'Frank',
        email: 'frank@test.com',
      });
      await app.userService.findById(user.id);
      await app.userService.findAll();
      await app.userService.update(user.id, { name: 'Francis' });

      const readOps = app.transversal.operations.filter((op) => op.type === 'read');
      const writeOps = app.transversal.operations.filter(
        (op) => op.type === 'write'
      );

      expect(readOps.length).toBe(2);
      expect(writeOps.length).toBe(2);
      expect(readOps.map((op) => op.method)).toContain('findById');
      expect(readOps.map((op) => op.method)).toContain('findAll');
      expect(writeOps.map((op) => op.method)).toContain('create');
      expect(writeOps.map((op) => op.method)).toContain('update');
    });
  });
});
