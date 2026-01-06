import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  Assemblage,
  Assembler,
  AbstractAssemblage,
  Context,
  TransversalManager,
  type AssemblerContext,
} from '../src';
import {
  AbstractUserService,
  UserService,
  ValidationTransversal,
  SecurityTransversal,
  PerformanceTransversal,
} from './fixtures/transversals';

describe('AOP (Transversals) - Transversal Priorities', () => {
  beforeEach(() => {
    TransversalManager.resetGlobalState();
  });

  it('should execute higher priority advices first', async () => {
    @Assemblage({
      inject: [[AbstractUserService, UserService]],
      engage: [[ValidationTransversal], [PerformanceTransversal]],
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: AbstractUserService,
        public validationTransversal: ValidationTransversal,
        public performanceTransversal: PerformanceTransversal
      ) {}
    }

    const app = Assembler.build(App);

    // Validation has priority 100, Performance has priority 50
    // So validation should execute first
    await app.userService.create({ name: 'Alice', email: 'alice@test.com' });

    expect(app.validationTransversal.validations).toContain('validateCreate');
    expect(app.performanceTransversal.measurements.length).toBeGreaterThan(0);
  });

  it('should stop execution if high priority advice throws', async () => {
    @Assemblage({
      inject: [[AbstractUserService, UserService]],
      engage: [[ValidationTransversal], [PerformanceTransversal]],
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: AbstractUserService,
        @Context() public context: AssemblerContext
      ) {}
    }

    const app = Assembler.build(App);
    const performanceTransversal = app.context.require(
      PerformanceTransversal
    ) as PerformanceTransversal;

    // Missing required fields - validation should fail
    try {
      await app.userService.create({ name: 'Bob' } as any);
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Validation failed: email is required');
    }

    // Performance transversal should not record since execution stopped at validation
    expect(performanceTransversal.measurements.length).toBe(0);
  });

  it('should handle multiple transversals with different priorities', async () => {
    @Assemblage({
      inject: [[AbstractUserService, UserService]],
      engage: [
        [ValidationTransversal], // priority 100
        [SecurityTransversal], // priority 90
        [PerformanceTransversal], // priority 50
      ],
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: AbstractUserService,
        public validationTransversal: ValidationTransversal,
        public securityTransversal: SecurityTransversal,
        public performanceTransversal: PerformanceTransversal
      ) {}
    }

    const app = Assembler.build(App);

    // Set up security context
    app.securityTransversal.setCurrentUser({ id: '1', role: 'admin' });

    // Create should work with admin user
    const user = await app.userService.create({
      name: 'Charlie',
      email: 'charlie@test.com',
    });

    // All transversals should have executed
    expect(app.validationTransversal.validations.length).toBeGreaterThan(0);
    expect(app.performanceTransversal.measurements.length).toBeGreaterThan(0);

    // Now try to update - security should check permissions
    await app.userService.update(user.id, { name: 'Charles' });

    expect(app.securityTransversal.checks).toContain('checkUpdatePermission');
  });

  it('should execute transversals in priority order even with errors', async () => {
    @Assemblage({
      inject: [[AbstractUserService, UserService]],
      engage: [[ValidationTransversal], [SecurityTransversal]],
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: AbstractUserService,
        public validationTransversal: ValidationTransversal,
        public securityTransversal: SecurityTransversal
      ) {}
    }

    const app = Assembler.build(App);

    // No security context - should fail at security check
    try {
      await app.userService.delete('1');
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Unauthorized: No user authenticated');
    }

    // Security transversal should have run (priority 90)
    expect(app.securityTransversal.checks).toContain('checkDeletePermission');
  });

  it('should handle transversal configuration', async () => {
    @Assemblage({
      inject: [[AbstractUserService, UserService]],
      engage: [
        [ValidationTransversal],
        [PerformanceTransversal, { threshold: 100 }], // High threshold to test filtering
      ],
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: AbstractUserService,
        public validationTransversal: ValidationTransversal,
        public performanceTransversal: PerformanceTransversal
      ) {}
    }

    const app = Assembler.build(App);

    await app.userService.create({ name: 'David', email: 'david@test.com' });

    // Verify that config is injected correctly
    expect(app.performanceTransversal.config?.threshold).toBe(100);
    
    // transversals should work with configuration
    expect(app.validationTransversal.validations.length).toBeGreaterThan(0);
    // With threshold: 100, fast calls are not measured
    expect(app.performanceTransversal.measurements.length).toBe(0);
  });
});
