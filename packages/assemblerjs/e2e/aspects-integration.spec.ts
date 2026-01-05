import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { Assemblage, Assembler, AbstractAssemblage } from '../src';
import {
  AbstractUserService,
  UserService,
  LoggingAspect,
  ValidationAspect,
  PerformanceAspect,
  CachingAspect,
  SecurityAspect,
} from './fixtures/aspects';

describe('AOP - Integration Tests', () => {
  it('should work with multiple aspects on same target', async () => {
    @Assemblage({
      inject: [[AbstractUserService, UserService]],
      aspects: [
        [LoggingAspect],
        [ValidationAspect],
        [PerformanceAspect],
      ],
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: AbstractUserService,
        public loggingAspect: LoggingAspect,
        public validationAspect: ValidationAspect,
        public performanceAspect: PerformanceAspect
      ) {}
    }

    const app = Assembler.build(App);
    
    const user = await app.userService.create({ name: 'Alice', email: 'alice@test.com' });
    
    // All aspects should have executed
    expect(app.loggingAspect.logs.length).toBeGreaterThan(0);
    expect(app.validationAspect.validations).toContain('validateCreate');
    expect(app.performanceAspect.measurements.length).toBeGreaterThan(0);
    
    // Verify result is correct
    expect(user.name).toBe('Alice');
    expect(user.email).toBe('alice@test.com');
  });

  it('should handle aspect interactions and cross-cutting concerns', async () => {
    @Assemblage({
      inject: [[AbstractUserService, UserService]],
      aspects: [
        [ValidationAspect],
        [SecurityAspect],
        [PerformanceAspect],
        [LoggingAspect],
      ],
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: AbstractUserService,
        public validationAspect: ValidationAspect,
        public securityAspect: SecurityAspect,
        public performanceAspect: PerformanceAspect,
        public loggingAspect: LoggingAspect
      ) {}
    }

    const app = Assembler.build(App);
    
    // Set admin user
    app.securityAspect.setCurrentUser({ id: '1', role: 'admin' });
    
    // Create user (validation + security + performance + logging)
    const user = await app.userService.create({ name: 'Bob', email: 'bob@test.com' });
    
    // Update user (validation + security + performance + logging)
    await app.userService.update(user.id, { name: 'Robert' });
    
    // Delete user (security + performance + logging)
    await app.userService.delete(user.id);
    
    // Check all aspects were involved
    expect(app.validationAspect.validations.length).toBe(2); // create + update
    expect(app.securityAspect.checks.length).toBe(2); // update + delete
    expect(app.performanceAspect.measurements.length).toBe(3); // create + update + delete
    expect(app.loggingAspect.logs.length).toBeGreaterThan(0);
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
      aspects: [[LoggingAspect]],
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: AbstractUserService,
        public anotherService: AnotherService,
        public loggingAspect: LoggingAspect
      ) {}
    }

    const app = Assembler.build(App);
    
    await app.userService.create({ name: 'Charlie', email: 'charlie@test.com' });
    
    // Logging aspect should have logs from UserService
    expect(app.loggingAspect.logs.some(log => log.includes('create'))).toBe(true);
  });

  it('should handle errors gracefully through aspect chain', async () => {
    @Assemblage({
      inject: [[AbstractUserService, UserService]],
      aspects: [
        [ValidationAspect],
        [LoggingAspect],
        [PerformanceAspect],
      ],
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: AbstractUserService,
        public validationAspect: ValidationAspect,
        public loggingAspect: LoggingAspect,
        public performanceAspect: PerformanceAspect
      ) {}
    }

    const app = Assembler.build(App);
    
    // Try to create with missing email (should fail validation)
    await expect(
      app.userService.create({ name: 'David' })
    ).rejects.toThrow('email is required');
    
    // Validation should have run
    expect(app.validationAspect.validations).toContain('validateCreate');
    
    // Performance should still have measured (even if failed)
    expect(app.performanceAspect.measurements.length).toBeGreaterThan(0);
  });

  it('should work with caching aspect', async () => {
    @Assemblage({
      inject: [[AbstractUserService, UserService]],
      aspects: [[CachingAspect]],
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: AbstractUserService,
        public cachingAspect: CachingAspect
      ) {}
    }

    const app = Assembler.build(App);
    
    const user = await app.userService.create({ name: 'Eve', email: 'eve@test.com' });
    
    // First find - cache miss
    await app.userService.findById(user.id);
    expect(app.cachingAspect.misses).toBe(1);
    expect(app.cachingAspect.hits).toBe(0);
    
    // Second find - cache hit
    await app.userService.findById(user.id);
    expect(app.cachingAspect.hits).toBe(1);
    
    // Update invalidates cache
    await app.userService.update(user.id, { name: 'Eva' });
    
    // Next find is a miss again
    await app.userService.findById(user.id);
    expect(app.cachingAspect.misses).toBe(2);
  });

  it('should support aspects on transient assemblages', async () => {
    @Assemblage({
      singleton: false,
      aspects: [[LoggingAspect]],
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
        public loggingAspect: LoggingAspect
      ) {}
    }

    const app = Assembler.build(App);
    
    app.service.getValue();
    
    expect(app.loggingAspect.logs.some(log => log.includes('getValue'))).toBe(true);
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
      aspects: [
        [ValidationAspect],
        [SecurityAspect],
        [PerformanceAspect],
        [LoggingAspect],
        [CachingAspect],
      ],
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: AbstractUserService,
        public validationAspect: ValidationAspect,
        public securityAspect: SecurityAspect,
        public performanceAspect: PerformanceAspect,
        public loggingAspect: LoggingAspect,
        public cachingAspect: CachingAspect
      ) {}
    }

    const app = Assembler.build(App);
    
    // Set up security context
    app.securityAspect.setCurrentUser({ id: 'admin', role: 'admin' });
    
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
    expect(app.validationAspect.validations.length).toBeGreaterThan(0);
    expect(app.securityAspect.checks.length).toBeGreaterThan(0);
    expect(app.performanceAspect.measurements.length).toBeGreaterThan(0);
    expect(app.loggingAspect.logs.length).toBeGreaterThan(0);
    expect(app.cachingAspect.hits).toBeGreaterThan(0);
    expect(app.cachingAspect.misses).toBeGreaterThan(0);
  });
});
