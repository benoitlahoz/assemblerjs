import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { Assemblage, Assembler, AbstractAssemblage, Transversal, Before, Affect, Context, TransversalManager, type AdviceContext, type AssemblerContext } from '../src';
import { PerformanceTransversal } from './fixtures/transversals';

// Simple logging transversal
@Transversal()
class LoggingTransversal {
  logs: string[] = [];

  // This advice will NOT match any pointcut (no automatic application)
  @Before('execution(NothingMatches.*)', 100)
  logMethodCall(context: AdviceContext) {
    this.logs.push(`[BEFORE] ${context.methodName}`);
  }
}

// Service with @Affect decorator
@Assemblage()
class UserService {
  // Explicitly apply transversal to this method only
  @Affect(LoggingTransversal)
  create(name: string) {
    return { id: '1', name };
  }

  // No transversal applied
  findAll() {
    return [];
  }
}

describe('AOP (Transversals) - @Affect Decorator', () => {
  beforeEach(() => {
    TransversalManager.resetGlobalState();
  });
  it('should apply transversal only to methods with @Affect decorator', () => {
    @Assemblage({
      inject: [[UserService]],
      engage: [[LoggingTransversal]], // Register the transversal
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: UserService,
        public loggingTransversal: LoggingTransversal,
        @Context() public context: AssemblerContext
      ) {}
    }

    const app = Assembler.build(App);

    // Call method with @Affect
    app.userService.create('Alice');
    
    // Call method without @Affect
    app.userService.findAll();

    // Only create should be logged (findAll should not)
    expect(app.loggingTransversal.logs).toHaveLength(1);
    expect(app.loggingTransversal.logs[0]).toContain('create');
  });

  it('should apply multiple transversals to same method with @Affect', () => {
    @Transversal()
    class ValidationTransversal {
      validations: string[] = [];

      @Before('execution(NothingMatches.*)')
      validate(context: AdviceContext) {
        this.validations.push(`validate:${context.methodName}`);
      }
    }

    @Assemblage()
    class ProductService {
      @Affect(LoggingTransversal)
      @Affect(ValidationTransversal)
      create(name: string) {
        return { id: '1', name };
      }
    }

    @Assemblage({
      inject: [[ProductService]],
      engage: [[LoggingTransversal], [ValidationTransversal]],
    })
    class App implements AbstractAssemblage {
      constructor(
        public productService: ProductService,
        public loggingTransversal: LoggingTransversal,
        public validationTransversal: ValidationTransversal,
        @Context() public context: AssemblerContext
      ) {}
    }

    const app = Assembler.build(App);
    
    app.productService.create('Product');

    expect(app.loggingTransversal.logs).toHaveLength(1);
    expect(app.validationTransversal.validations).toHaveLength(1);
  });

  it('should combine pointcut matching with @Affect', () => {
    @Transversal()
    class MixedTransversal {
      logs: string[] = [];

      // This will match 'create' via pointcut
      @Before('execution(*.create)')
      autoApplied(context: AdviceContext) {
        this.logs.push(`[AUTO] ${context.methodName}`);
      }

      // This needs explicit @Affect
      @Before('execution(NothingMatches.*)')
      manualApplied(context: AdviceContext) {
        this.logs.push(`[MANUAL] ${context.methodName}`);
      }
    }

    @Assemblage()
    class OrderService {
      // Will trigger autoApplied via pointcut
      create(data: any) {
        return { id: '1', ...data };
      }

      // Will trigger manualApplied via @Affect
      @Affect(MixedTransversal)
      update(id: string, data: any) {
        return { id, ...data };
      }
    }

    @Assemblage({
      inject: [[OrderService]],
      engage: [[MixedTransversal]],
    })
    class App implements AbstractAssemblage {
      constructor(
        public orderService: OrderService,
        public mixedTransversal: MixedTransversal,
        @Context() public context: AssemblerContext
      ) {}
    }

    const app = Assembler.build(App);

    app.orderService.create({ item: 'Book' });
    app.orderService.update('1', { item: 'Updated Book' });

    // create: 1 auto advice
    // update: 2 advices (auto + manual)
    expect(app.mixedTransversal.logs).toContain('[AUTO] create');
    expect(app.mixedTransversal.logs).toContain('[AUTO] update');
    expect(app.mixedTransversal.logs).toContain('[MANUAL] update');
    expect(app.mixedTransversal.logs).toHaveLength(3);
  });

  it('should apply PerformanceTransversal with different threshold configs using @Affect', async () => {
    @Assemblage()
    class TestService {
      @Affect(PerformanceTransversal, { threshold: 50 }) // Low threshold
      fastMethod() {
        return 'fast';
      }

      @Affect(PerformanceTransversal) // Use default transversal config
      async mediumMethod() {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms - OK with global config, above 50, below 200
        return 'medium';
      }

      @Affect(PerformanceTransversal, { threshold: 200 }) // High threshold
      async slowMethod() {
        await new Promise(resolve => setTimeout(resolve, 250)); // 250ms - above both thresholds
        return 'slow';
      }
    }

    @Assemblage({
      inject: [[TestService]],
      engage: [[PerformanceTransversal, { threshold: 100 }]], // Global config is overridden by @Affect
    })
    class App implements AbstractAssemblage {
      constructor(
        public testService: TestService,
        public performanceTransversal: PerformanceTransversal,
        @Context() public context: AssemblerContext
      ) {}
    }

    const app = Assembler.build(App);

    // Fast method: duration ~0ms < 50ms, should not be measured
    app.testService.fastMethod();
    expect(app.performanceTransversal.measurements.length).toBe(0);

    // Medium method: 100ms >= 50ms, should be measured once
    await app.testService.mediumMethod();
    expect(app.performanceTransversal.measurements.length).toBe(1);
    expect(app.performanceTransversal.measurements[0].method).toBe('mediumMethod');

    // Slow method: 250ms >= 200ms, should be measured again
    await app.testService.slowMethod();
    expect(app.performanceTransversal.measurements.length).toBe(2);
    expect(app.performanceTransversal.measurements[1].method).toBe('slowMethod');
  });
});
