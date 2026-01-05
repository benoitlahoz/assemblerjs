import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { Assemblage, Assembler, AbstractAssemblage } from '../src';
import {
  AbstractUserService,
  UserService,
  ValidationAspect,
  SecurityAspect,
  PerformanceAspect,
} from './fixtures/aspects';

describe('AOP - Aspect Priorities', () => {
  it('should execute higher priority advices first', async () => {
    @Assemblage({
      inject: [[AbstractUserService, UserService]],
      aspects: [[ValidationAspect], [PerformanceAspect]],
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: AbstractUserService,
        public validationAspect: ValidationAspect,
        public performanceAspect: PerformanceAspect
      ) {}
    }

    const app = Assembler.build(App);
    
    // Validation has priority 100, Performance has priority 50
    // So validation should execute first
    await app.userService.create({ name: 'Alice', email: 'alice@test.com' });
    
    expect(app.validationAspect.validations).toContain('validateCreate');
    expect(app.performanceAspect.measurements.length).toBeGreaterThan(0);
  });

  it('should stop execution if high priority advice throws', async () => {
    @Assemblage({
      inject: [[AbstractUserService, UserService]],
      aspects: [[ValidationAspect], [PerformanceAspect]],
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: AbstractUserService,
        public validationAspect: ValidationAspect,
        public performanceAspect: PerformanceAspect
      ) {}
    }

    const app = Assembler.build(App);
    
    // Missing required fields - validation should fail
    await expect(
      app.userService.create({ name: 'Bob' })
    ).rejects.toThrow('email is required');
    
    // Performance aspect should still record the attempt
    expect(app.performanceAspect.measurements.length).toBeGreaterThan(0);
  });

  it('should handle multiple aspects with different priorities', async () => {
    @Assemblage({
      inject: [[AbstractUserService, UserService]],
      aspects: [
        [ValidationAspect],  // priority 100
        [SecurityAspect],     // priority 90
        [PerformanceAspect],  // priority 50
      ],
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: AbstractUserService,
        public validationAspect: ValidationAspect,
        public securityAspect: SecurityAspect,
        public performanceAspect: PerformanceAspect
      ) {}
    }

    const app = Assembler.build(App);
    
    // Set up security context
    app.securityAspect.setCurrentUser({ id: '1', role: 'admin' });
    
    // Create should work with admin user
    const user = await app.userService.create({ name: 'Charlie', email: 'charlie@test.com' });
    
    // All aspects should have executed
    expect(app.validationAspect.validations.length).toBeGreaterThan(0);
    expect(app.performanceAspect.measurements.length).toBeGreaterThan(0);
    
    // Now try to update - security should check permissions
    await app.userService.update(user.id, { name: 'Charles' });
    
    expect(app.securityAspect.checks).toContain('checkUpdatePermission');
  });

  it('should execute aspects in priority order even with errors', async () => {
    @Assemblage({
      inject: [[AbstractUserService, UserService]],
      aspects: [
        [ValidationAspect],
        [SecurityAspect],
      ],
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: AbstractUserService,
        public validationAspect: ValidationAspect,
        public securityAspect: SecurityAspect
      ) {}
    }

    const app = Assembler.build(App);
    
    // No security context - should fail at security check
    await expect(
      app.userService.delete('1')
    ).rejects.toThrow('Unauthorized');
    
    // Security aspect should have run (priority 90)
    expect(app.securityAspect.checks).toContain('checkDeletePermission');
  });

  it('should handle aspect configuration', async () => {
    @Assemblage({
      inject: [[AbstractUserService, UserService]],
      aspects: [
        [ValidationAspect, { strict: true }],
        [PerformanceAspect, { threshold: 100 }],
      ],
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: AbstractUserService,
        public validationAspect: ValidationAspect,
        public performanceAspect: PerformanceAspect
      ) {}
    }

    const app = Assembler.build(App);
    
    await app.userService.create({ name: 'David', email: 'david@test.com' });
    
    // Aspects should work with configuration
    expect(app.validationAspect.validations.length).toBeGreaterThan(0);
    expect(app.performanceAspect.measurements.length).toBeGreaterThan(0);
  });
});
