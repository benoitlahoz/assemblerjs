import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { Assemblage, Assembler, AbstractAssemblage, Aspect, Before, AbstractAspect, type AdviceContext } from '../src';
import {
  AbstractUserService,
  UserService,
} from './fixtures/aspects';

describe('AOP - Pointcut Patterns', () => {
  describe('Wildcard patterns', () => {
    it('should match all methods with * wildcard', async () => {
      @Aspect()
      @Assemblage()
      class AllMethodsAspect extends AbstractAspect {
        public calls: string[] = [];

        @Before('execution(UserService.*)')
        logAllMethods(context: AdviceContext) {
          this.calls.push(context.methodName);
        }
      }

      @Assemblage({
        inject: [[AbstractUserService, UserService]],
        aspects: [[AllMethodsAspect]],
      })
      class App implements AbstractAssemblage {
        constructor(
          public userService: AbstractUserService,
          public aspect: AllMethodsAspect
        ) {}
      }

      const app = Assembler.build(App);
      
      await app.userService.create({ name: 'Alice', email: 'alice@test.com' });
      await app.userService.findAll();
      (app.userService as UserService).count();
      
      expect(app.aspect.calls).toContain('create');
      expect(app.aspect.calls).toContain('findAll');
      expect(app.aspect.calls).toContain('count');
    });

    it('should match specific method with exact name', async () => {
      @Aspect()
      @Assemblage()
      class CreateOnlyAspect extends AbstractAspect {
        public calls: string[] = [];

        @Before('execution(UserService.create)')
        logCreate(context: AdviceContext) {
          this.calls.push(context.methodName);
        }
      }

      @Assemblage({
        inject: [[AbstractUserService, UserService]],
        aspects: [[CreateOnlyAspect]],
      })
      class App implements AbstractAssemblage {
        constructor(
          public userService: AbstractUserService,
          public aspect: CreateOnlyAspect
        ) {}
      }

      const app = Assembler.build(App);
      
      await app.userService.create({ name: 'Bob', email: 'bob@test.com' });
      await app.userService.findAll();
      
      expect(app.aspect.calls).toContain('create');
      expect(app.aspect.calls).not.toContain('findAll');
    });

    it('should match methods starting with pattern', async () => {
      @Aspect()
      @Assemblage()
      class FindMethodsAspect extends AbstractAspect {
        public calls: string[] = [];

        @Before('execution(UserService.find*)')
        logFindMethods(context: AdviceContext) {
          this.calls.push(context.methodName);
        }
      }

      @Assemblage({
        inject: [[AbstractUserService, UserService]],
        aspects: [[FindMethodsAspect]],
      })
      class App implements AbstractAssemblage {
        constructor(
          public userService: AbstractUserService,
          public aspect: FindMethodsAspect
        ) {}
      }

      const app = Assembler.build(App);
      
      await app.userService.create({ name: 'Charlie', email: 'charlie@test.com' });
      await app.userService.findAll();
      (app.userService as UserService).findByEmail('charlie@test.com');
      
      expect(app.aspect.calls).not.toContain('create');
      expect(app.aspect.calls).toContain('findAll');
      expect(app.aspect.calls).toContain('findByEmail');
    });

    it('should match any class with wildcard', async () => {
      @Aspect()
      @Assemblage()
      class AnyClassAspect extends AbstractAspect {
        public calls: string[] = [];

        @Before('execution(*.create)')
        logAnyCreate(context: AdviceContext) {
          this.calls.push(`${context.target.constructor.name}.${context.methodName}`);
        }
      }

      @Assemblage({
        inject: [[AbstractUserService, UserService]],
        aspects: [[AnyClassAspect]],
      })
      class App implements AbstractAssemblage {
        constructor(
          public userService: AbstractUserService,
          public aspect: AnyClassAspect
        ) {}
      }

      const app = Assembler.build(App);
      
      await app.userService.create({ name: 'David', email: 'david@test.com' });
      
      expect(app.aspect.calls).toContain('UserService.create');
    });
  });

  describe('Multiple pointcuts', () => {
    it('should handle multiple pointcuts on same advice', async () => {
      @Aspect()
      @Assemblage()
      class MultiPointcutAspect extends AbstractAspect {
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
        aspects: [[MultiPointcutAspect]],
      })
      class App implements AbstractAssemblage {
        constructor(
          public userService: AbstractUserService,
          public aspect: MultiPointcutAspect
        ) {}
      }

      const app = Assembler.build(App);
      
      const user = await app.userService.create({ name: 'Eve', email: 'eve@test.com' });
      await app.userService.update(user.id, { name: 'Eva' });
      await app.userService.delete(user.id);
      await app.userService.findAll();
      
      expect(app.aspect.calls).toContain('create');
      expect(app.aspect.calls).toContain('update');
      expect(app.aspect.calls).toContain('delete');
      expect(app.aspect.calls).not.toContain('findAll');
    });
  });

  describe('Pattern combinations', () => {
    it('should handle complex wildcard patterns', async () => {
      @Aspect()      @Assemblage()      class ComplexPatternAspect implements AbstractAspect {
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
        aspects: [[ComplexPatternAspect]],
      })
      class App implements AbstractAssemblage {
        constructor(
          public userService: AbstractUserService,
          public aspect: ComplexPatternAspect
        ) {}
      }

      const app = Assembler.build(App);
      
      const user = await app.userService.create({ name: 'Frank', email: 'frank@test.com' });
      await app.userService.findById(user.id);
      await app.userService.findAll();
      await app.userService.update(user.id, { name: 'Francis' });
      
      const readOps = app.aspect.operations.filter(op => op.type === 'read');
      const writeOps = app.aspect.operations.filter(op => op.type === 'write');
      
      expect(readOps.length).toBe(2);
      expect(writeOps.length).toBe(2);
      expect(readOps.map(op => op.method)).toContain('findById');
      expect(readOps.map(op => op.method)).toContain('findAll');
      expect(writeOps.map(op => op.method)).toContain('create');
      expect(writeOps.map(op => op.method)).toContain('update');
    });
  });
});
