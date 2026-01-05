import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { Assemblage, Assembler, AbstractAssemblage, Aspect, Before, ApplyAspect, Context, AspectManager, type AdviceContext, type AssemblerContext } from '../src';

// Simple logging aspect
@Aspect()
class LoggingAspect {
  logs: string[] = [];

  // This advice will NOT match any pointcut (no automatic application)
  @Before('execution(NothingMatches.*)', 100)
  logMethodCall(context: AdviceContext) {
    this.logs.push(`[BEFORE] ${context.methodName}`);
  }
}

// Service with @ApplyAspect decorator
@Assemblage()
class UserService {
  // Explicitly apply aspect to this method only
  @ApplyAspect(LoggingAspect)
  create(name: string) {
    return { id: '1', name };
  }

  // No aspect applied
  findAll() {
    return [];
  }
}

describe('AOP - @ApplyAspect Decorator', () => {
  beforeEach(() => {
    AspectManager.resetGlobalState();
  });
  it('should apply aspect only to methods with @ApplyAspect decorator', () => {
    @Assemblage({
      inject: [[UserService]],
      aspects: [[LoggingAspect]], // Register the aspect
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: UserService,
        public loggingAspect: LoggingAspect,
        @Context() public context: AssemblerContext
      ) {}
    }

    const app = Assembler.build(App);

    // Call method with @ApplyAspect
    app.userService.create('Alice');
    
    // Call method without @ApplyAspect
    app.userService.findAll();

    // Only create should be logged (findAll should not)
    expect(app.loggingAspect.logs).toHaveLength(1);
    expect(app.loggingAspect.logs[0]).toContain('create');
  });

  it('should apply multiple aspects to same method with @ApplyAspect', () => {
    @Aspect()
    class ValidationAspect {
      validations: string[] = [];

      @Before('execution(NothingMatches.*)')
      validate(context: AdviceContext) {
        this.validations.push(`validate:${context.methodName}`);
      }
    }

    @Assemblage()
    class ProductService {
      @ApplyAspect(LoggingAspect)
      @ApplyAspect(ValidationAspect)
      create(name: string) {
        return { id: '1', name };
      }
    }

    @Assemblage({
      inject: [[ProductService]],
      aspects: [[LoggingAspect], [ValidationAspect]],
    })
    class App implements AbstractAssemblage {
      constructor(
        public productService: ProductService,
        public loggingAspect: LoggingAspect,
        public validationAspect: ValidationAspect,
        @Context() public context: AssemblerContext
      ) {}
    }

    const app = Assembler.build(App);
    
    app.productService.create('Product');

    expect(app.loggingAspect.logs).toHaveLength(1);
    expect(app.validationAspect.validations).toHaveLength(1);
  });

  it('should combine pointcut matching with @ApplyAspect', () => {
    @Aspect()
    class MixedAspect {
      logs: string[] = [];

      // This will match 'create' via pointcut
      @Before('execution(*.create)')
      autoApplied(context: AdviceContext) {
        this.logs.push(`[AUTO] ${context.methodName}`);
      }

      // This needs explicit @ApplyAspect
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

      // Will trigger manualApplied via @ApplyAspect
      @ApplyAspect(MixedAspect)
      update(id: string, data: any) {
        return { id, ...data };
      }
    }

    @Assemblage({
      inject: [[OrderService]],
      aspects: [[MixedAspect]],
    })
    class App implements AbstractAssemblage {
      constructor(
        public orderService: OrderService,
        public mixedAspect: MixedAspect,
        @Context() public context: AssemblerContext
      ) {}
    }

    const app = Assembler.build(App);

    app.orderService.create({ item: 'Book' });
    app.orderService.update('1', { item: 'Updated Book' });

    // create: 1 auto advice
    // update: 2 advices (auto + manual)
    expect(app.mixedAspect.logs).toContain('[AUTO] create');
    expect(app.mixedAspect.logs).toContain('[AUTO] update');
    expect(app.mixedAspect.logs).toContain('[MANUAL] update');
    expect(app.mixedAspect.logs).toHaveLength(3);
  });
});
