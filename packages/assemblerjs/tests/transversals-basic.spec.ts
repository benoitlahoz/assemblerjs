import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { Assemblage, Assembler, AbstractAssemblage, Context, TransversalManager, type AssemblerContext } from '../src';
import {
  AbstractUserService,
  UserService,
  LoggingTransversal,
  AbstractLoggingTransversal,
} from './fixtures/transversals';

describe('AOP (Transversals) - Basic Advices', () => {
  beforeEach(() => {
    TransversalManager.resetGlobalState();
  });

  describe('@Before advice', () => {
    it('should execute before advice before the target method', async () => {
      @Assemblage({
        inject: [
          [AbstractUserService, UserService],
        ],
        engage: [[LoggingTransversal]],
      })
      class App implements AbstractAssemblage {
        constructor(
          public userService: AbstractUserService,
          @Context() public context: AssemblerContext
        ) {}
      }

      const app = Assembler.build(App);
      const loggingTransversal = app.context.require(LoggingTransversal) as LoggingTransversal;
      
      await app.userService.create({ name: 'John', email: 'john@test.com' });
      
      const beforeLog = loggingTransversal.logs.find(log => log.includes('[BEFORE] create'));
      expect(beforeLog).toBeDefined();
      expect(beforeLog).toContain('John');
      expect(beforeLog).toContain('john@test.com');
    });

    it('should execute before advice for all matching methods', async () => {
      @Assemblage({
        inject: [[AbstractUserService, UserService]],
        engage: [[AbstractLoggingTransversal, LoggingTransversal]],
      })
      class App implements AbstractAssemblage {
        constructor(
          public userService: AbstractUserService,
          public loggingTransversal: AbstractLoggingTransversal
        ) {}
      }

      const app = Assembler.build(App);
      
      await app.userService.create({ name: 'Alice', email: 'alice@test.com' });
      await app.userService.findAll();
      
      const beforeLogs = app.loggingTransversal.logs.filter(log => log.includes('[BEFORE]'));
      expect(beforeLogs).toHaveLength(2);
      expect(beforeLogs[0]).toContain('create');
      expect(beforeLogs[1]).toContain('findAll');
    });
  });

  describe('@After advice', () => {
    it('should execute after advice after the target method', async () => {
      @Assemblage({
        inject: [[AbstractUserService, UserService]],
        engage: [[LoggingTransversal]],
      })
      class App implements AbstractAssemblage {
        constructor(
          public userService: AbstractUserService,
          public loggingTransversal: LoggingTransversal
        ) {}
      }

      const app = Assembler.build(App);
      
      const user = await app.userService.create({ name: 'Bob', email: 'bob@test.com' });
      
      const afterLog = app.loggingTransversal.logs.find(log => log.includes('[AFTER] create'));
      expect(afterLog).toBeDefined();
      expect(afterLog).toContain(user.id);
      expect(afterLog).toContain('Bob');
    });

    it('should have access to method result in after advice', async () => {
      @Assemblage({
        inject: [[AbstractUserService, UserService]],
        engage: [[LoggingTransversal]],
      })
      class App implements AbstractAssemblage {
        constructor(
          public userService: AbstractUserService,
          public loggingTransversal: LoggingTransversal
        ) {}
      }

      const app = Assembler.build(App);
      
      await app.userService.create({ name: 'Charlie', email: 'charlie@test.com' });
      const users = await app.userService.findAll();
      
      const afterLog = app.loggingTransversal.logs.find(log => log.includes('[AFTER] findAll'));
      expect(afterLog).toBeDefined();
      expect(afterLog).toContain(JSON.stringify(users));
    });
  });

  describe('@Around advice', () => {
    it('should wrap the target method execution', async () => {
      @Assemblage({
        inject: [[AbstractUserService, UserService]],
        engage: [[LoggingTransversal]],
      })
      class App implements AbstractAssemblage {
        constructor(
          public userService: AbstractUserService,
          public loggingTransversal: LoggingTransversal
        ) {}
      }

      const app = Assembler.build(App);
      
      await app.userService.create({ name: 'David', email: 'david@test.com' });
      
      const startLog = app.loggingTransversal.logs.find(log => log.includes('[AROUND-START]'));
      const endLog = app.loggingTransversal.logs.find(log => log.includes('[AROUND-END]'));
      
      expect(startLog).toBeDefined();
      expect(endLog).toBeDefined();
      expect(endLog).toMatch(/\(\d+ms\)/);
    });

    it('should allow modification of execution flow', async () => {
      @Assemblage({
        inject: [[AbstractUserService, UserService]],
        engage: [[LoggingTransversal]],
      })
      class App implements AbstractAssemblage {
        constructor(
          public userService: AbstractUserService,
          public loggingTransversal: LoggingTransversal
        ) {}
      }

      const app = Assembler.build(App);
      
      const user = await app.userService.create({ name: 'Eve', email: 'eve@test.com' });
      
      // Verify the result is still correct
      expect(user.name).toBe('Eve');
      expect(user.email).toBe('eve@test.com');
      
      // Verify around advice executed
      expect(app.loggingTransversal.logs.some(log => log.includes('[AROUND-START]'))).toBe(true);
      expect(app.loggingTransversal.logs.some(log => log.includes('[AROUND-END]'))).toBe(true);
    });

    it('should handle errors in around advice', async () => {
      @Assemblage({
        inject: [[AbstractUserService, UserService]],
        engage: [[LoggingTransversal]],
      })
      class App implements AbstractAssemblage {
        constructor(
          public userService: AbstractUserService,
          public loggingTransversal: LoggingTransversal
        ) {}
      }

      const app = Assembler.build(App);
      
      // This should throw because user doesn't exist
      await expect(app.userService.findById('999')).rejects.toThrow('not found');
      
      // Around advice should still be in logs for create (from previous tests in same instance)
      // But not for findById which doesn't have @Around
    });
  });

  describe('Advice execution order', () => {
    it('should execute advices in correct order: before -> around -> method -> after', async () => {
      @Assemblage({
        inject: [[AbstractUserService, UserService]],
        engage: [[LoggingTransversal]],
      })
      class App implements AbstractAssemblage {
        constructor(
          public userService: AbstractUserService,
          public loggingTransversal: LoggingTransversal
        ) {}
      }

      const app = Assembler.build(App);
      
      await app.userService.create({ name: 'Frank', email: 'frank@test.com' });
      
      const logs = app.loggingTransversal.logs;
      const beforeIndex = logs.findIndex(log => log.includes('[BEFORE] create'));
      const aroundStartIndex = logs.findIndex(log => log.includes('[AROUND-START]'));
      const aroundEndIndex = logs.findIndex(log => log.includes('[AROUND-END]'));
      const afterIndex = logs.findIndex(log => log.includes('[AFTER] create'));
      
      // Verify order
      expect(beforeIndex).toBeLessThan(aroundStartIndex);
      expect(aroundStartIndex).toBeLessThan(aroundEndIndex);
      expect(aroundEndIndex).toBeLessThan(afterIndex);
    });
  });

  describe('Synchronous methods', () => {
    it('should work with synchronous methods', () => {
      @Assemblage({
        inject: [[AbstractUserService, UserService]],
        engage: [[LoggingTransversal]],
      })
      class App implements AbstractAssemblage {
        constructor(
          public userService: AbstractUserService,
          public loggingTransversal: LoggingTransversal
        ) {}
      }

      const app = Assembler.build(App);
      
      const count = (app.userService as UserService).count();
      
      expect(typeof count).toBe('number');
      expect(app.loggingTransversal.logs.some(log => log.includes('[BEFORE] count'))).toBe(true);
      expect(app.loggingTransversal.logs.some(log => log.includes('[AFTER] count'))).toBe(true);
    });
  });
});
