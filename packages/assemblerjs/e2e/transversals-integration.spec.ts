import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { Assemblage, Assembler, AbstractAssemblage, TransversalManager } from '../src';
import {
  AbstractUserService,
  UserService,
  LoggingTransversal,
  ValidationTransversal,
  PerformanceTransversal,
  CachingTransversal,
  SecurityTransversal,
} from './fixtures/transversals';

describe('AOP (Transversals) - Integration Tests', () => {
  beforeEach(() => {
    TransversalManager.resetGlobalState();
  });

  it('should work with multiple aspects on same target', async () => {
    @Assemblage({
      inject: [[AbstractUserService, UserService]],
      engage: [
        [LoggingTransversal],
        [ValidationTransversal],
        [PerformanceTransversal],
      ],
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: AbstractUserService,
        public loggingTransversal: LoggingTransversal,
        public validationTransversal: ValidationTransversal,
        public performanceTransversal: PerformanceTransversal
      ) {}
    }

    const app = Assembler.build(App);
    
    const user = await app.userService.create({ name: 'Alice', email: 'alice@test.com' });
    
    // All aspects should have executed
    expect(app.loggingTransversal.logs.length).toBeGreaterThan(0);
    expect(app.validationTransversal.validations).toContain('validateCreate');
    expect(app.performanceTransversal.measurements.length).toBeGreaterThan(0);
    
    // Verify result is correct
    expect(user.name).toBe('Alice');
    expect(user.email).toBe('alice@test.com');
  });

  it('should handle transversal interactions and cross-cutting concerns', async () => {
    @Assemblage({
      inject: [[AbstractUserService, UserService]],
      engage: [
        [ValidationTransversal],
        [SecurityTransversal],
        [PerformanceTransversal],
        [LoggingTransversal],
      ],
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: AbstractUserService,
        public validationTransversal: ValidationTransversal,
        public securityTransversal: SecurityTransversal,
        public performanceTransversal: PerformanceTransversal,
        public loggingTransversal: LoggingTransversal
      ) {}
    }

    const app = Assembler.build(App);
    
    // Set admin user
    app.securityTransversal.setCurrentUser({ id: '1', role: 'admin' });
    
    // Create user (validation + security + performance + logging)
    const user = await app.userService.create({ name: 'Bob', email: 'bob@test.com' });
    
    // Update user (validation + security + performance + logging)
    await app.userService.update(user.id, { name: 'Robert' });
    
    // Delete user (security + performance + logging)
    await app.userService.delete(user.id);
    
    // Check all aspects were involved
    expect(app.validationTransversal.validations.length).toBe(2); // create + update
    expect(app.securityTransversal.checks.length).toBe(2); // update + delete
    expect(app.performanceTransversal.measurements.length).toBe(3); // create + update + delete
    expect(app.loggingTransversal.logs.length).toBeGreaterThan(0);
  });

  it('should work with singleton aspects across multiple targets', async () => {
    @Assemblage()
    class AnotherService implements AbstractAssemblage {
      getData() {
        return { data: 'test' };
      }
    }

    @Assemblage({
      inject: [
        [AbstractUserService, UserService],
        [AnotherService],
      ],
      engage: [[LoggingTransversal]],
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: AbstractUserService,
        public anotherService: AnotherService,
        public loggingTransversal: LoggingTransversal
      ) {}
    }

    const app = Assembler.build(App);
    
    await app.userService.create({ name: 'Charlie', email: 'charlie@test.com' });
    
    // Logging transversal should have logs from UserService
    expect(app.loggingTransversal.logs.some(log => log.includes('create'))).toBe(true);
  });

  it('should handle errors gracefully through transversal chain', async () => {
    @Assemblage({
      inject: [[AbstractUserService, UserService]],
      engage: [
        [ValidationTransversal],
        [LoggingTransversal],
        [PerformanceTransversal],
      ],
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: AbstractUserService,
        public validationTransversal: ValidationTransversal,
        public loggingTransversal: LoggingTransversal,
        public performanceTransversal: PerformanceTransversal
      ) {}
    }

    const app = Assembler.build(App);
    
    // Try to create with missing email (should fail validation)
    try {
      await app.userService.create({ name: 'David' });
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Validation failed: email is required');
    }
    
    // Validation should have run
    expect(app.validationTransversal.validations).toContain('validateCreate');
    
    // Performance should not have measured since validation failed first
    expect(app.performanceTransversal.measurements.length).toBe(0);
  });

  it('should work with caching transversal', async () => {
    @Assemblage({
      inject: [[AbstractUserService, UserService]],
      engage: [[CachingTransversal]],
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: AbstractUserService,
        public cachingTransversal: CachingTransversal
      ) {}
    }

    const app = Assembler.build(App);
    
    const user = await app.userService.create({ name: 'Eve', email: 'eve@test.com' });
    
    // First find - cache miss
    await app.userService.findById(user.id);
    expect(app.cachingTransversal.misses).toBe(1);
    expect(app.cachingTransversal.hits).toBe(0);
    
    // Second find - cache hit
    await app.userService.findById(user.id);
    expect(app.cachingTransversal.hits).toBe(1);
    
    // Update invalidates cache
    await app.userService.update(user.id, { name: 'Eva' });
    
    // Next find is a miss again
    await app.userService.findById(user.id);
    expect(app.cachingTransversal.misses).toBe(2);
  });

  it('should support aspects on transient assemblages', async () => {
    @Assemblage({
      singleton: false,
      engage: [[LoggingTransversal]],
    })
    class TransientService implements AbstractAssemblage {
      getValue() {
        return 'value';
      }
    }

    @Assemblage({
      inject: [[TransientService]],
    })
    class App implements AbstractAssemblage {
      constructor(
        public service: TransientService,
        public loggingTransversal: LoggingTransversal
      ) {}
    }

    const app = Assembler.build(App);
    
    app.service.getValue();
    
    expect(app.loggingTransversal.logs.some(log => log.includes('getValue'))).toBe(true);
  });

  it('should work without aspects (no proxy overhead)', async () => {
    @Assemblage({
      inject: [[AbstractUserService, UserService]],
      // No aspects
    })
    class App implements AbstractAssemblage {
      constructor(public userService: AbstractUserService) {}
    }

    const app = Assembler.build(App);
    
    const user = await app.userService.create({ name: 'Frank', email: 'frank@test.com' });
    const found = await app.userService.findById(user.id);
    
    expect(found).toEqual(user);
  });

  it('should handle complex real-world scenario', async () => {
    @Assemblage({
      inject: [[AbstractUserService, UserService]],
      engage: [
        [ValidationTransversal],
        [SecurityTransversal],
        [PerformanceTransversal],
        [LoggingTransversal],
        [CachingTransversal],
      ],
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: AbstractUserService,
        public validationTransversal: ValidationTransversal,
        public securityTransversal: SecurityTransversal,
        public performanceTransversal: PerformanceTransversal,
        public loggingTransversal: LoggingTransversal,
        public cachingTransversal: CachingTransversal
      ) {}
    }

    const app = Assembler.build(App);
    
    // Set up security context
    app.securityTransversal.setCurrentUser({ id: 'admin', role: 'admin' });
    
    // Create multiple users
    const user1 = await app.userService.create({ name: 'User1', email: 'user1@test.com' });
    const user2 = await app.userService.create({ name: 'User2', email: 'user2@test.com' });
    
    // Read operations (should use cache)
    await app.userService.findById(user1.id);
    await app.userService.findById(user1.id); // Cache hit
    await app.userService.findAll();
    
    // Update operation (requires permission, invalidates cache)
    await app.userService.update(user1.id, { name: 'User One' });
    
    // Read after cache invalidation
    await app.userService.findById(user1.id); // Cache miss
    
    // Delete operation (requires admin)
    await app.userService.delete(user2.id);
    
    // Verify all aspects worked together
    expect(app.validationTransversal.validations.length).toBeGreaterThan(0);
    expect(app.securityTransversal.checks.length).toBeGreaterThan(0);
    expect(app.performanceTransversal.measurements.length).toBeGreaterThan(0);
    expect(app.loggingTransversal.logs.length).toBeGreaterThan(0);
    expect(app.cachingTransversal.hits).toBeGreaterThan(0);
    expect(app.cachingTransversal.misses).toBeGreaterThan(0);
  });
});
