import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  Assemblage,
  Assembler,
  AbstractAssemblage,
  Transversal,
  Before,
  Affect,
  Context,
  TransversalManager,
  type AdviceContext,
  type AssemblerContext,
} from '../src';

describe('AOP (Transversals) - Abstract Binding Resolution', () => {
  beforeEach(() => {
    TransversalManager.resetGlobalState();
  });

  it('should resolve @Affect(Abstract) when transversal is registered as [Abstract, Concrete] in engage', () => {
    // Define abstract transversal
    abstract class AbstractAuditTransversal implements AbstractAssemblage {
      abstract logs: string[];
      abstract audit(context: AdviceContext): void;
    }

    // Define concrete implementation
    @Transversal()
    class ConcreteAuditTransversal implements AbstractAuditTransversal {
      logs: string[] = [];

      @Before('execution(*.create)')
      audit(context: AdviceContext) {
        this.logs.push(`[AUDIT] ${context.methodName} called`);
      }
    }

    // Service using @Affect with abstract transversal
    @Assemblage()
    class UserService {
      @Affect(AbstractAuditTransversal)  // Using abstract, not concrete
      create(name: string) {
        return { id: 1, name };
      }
    }

    // App registering with [Abstract, Concrete]
    @Assemblage({
      inject: [[UserService]],
      engage: [[AbstractAuditTransversal, ConcreteAuditTransversal]],
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: UserService,
        @Context() public context: AssemblerContext
      ) {}
    }

    const app = Assembler.build(App);

    // Call method with @Affect
    app.userService.create('Alice');

    // Verify transversal was applied via abstract binding
    const auditTransversal = app.context.require(AbstractAuditTransversal);
    expect(auditTransversal).toBeDefined();
    expect(auditTransversal.logs).toContain('[AUDIT] create called');
  });

  it('should handle multiple @Affect decorators with different abstractions', () => {
    // First abstract transversal
    abstract class AbstractLoggingTransversal implements AbstractAssemblage {
      abstract logs: string[];
    }

    @Transversal()
    class ConcreteLoggingTransversal implements AbstractLoggingTransversal {
      logs: string[] = [];

      @Before('execution(*.create)')
      log(context: AdviceContext) {
        this.logs.push(`[LOG] ${context.methodName}`);
      }
    }

    // Second abstract transversal
    abstract class AbstractValidationTransversal implements AbstractAssemblage {
      abstract validations: string[];
    }

    @Transversal()
    class ConcreteValidationTransversal implements AbstractValidationTransversal {
      validations: string[] = [];

      @Before('execution(*.create)')
      validate(context: AdviceContext) {
        this.validations.push(`[VALIDATE] ${context.methodName}`);
      }
    }

    @Assemblage()
    class UserService {
      @Affect(AbstractLoggingTransversal)
      @Affect(AbstractValidationTransversal)
      create(name: string) {
        return { id: 1, name };
      }
    }

    @Assemblage({
      inject: [[UserService]],
      engage: [
        [AbstractLoggingTransversal, ConcreteLoggingTransversal],
        [AbstractValidationTransversal, ConcreteValidationTransversal],
      ],
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: UserService,
        @Context() public context: AssemblerContext
      ) {}
    }

    const app = Assembler.build(App);
    app.userService.create('Bob');

    const loggingTransversal = app.context.require(AbstractLoggingTransversal);
    const validationTransversal = app.context.require(AbstractValidationTransversal);

    expect(loggingTransversal.logs).toContain('[LOG] create');
    expect(validationTransversal.validations).toContain('[VALIDATE] create');
  });

  it('should use concrete class name when abstract and concrete are the same', () => {
    @Transversal()
    class SimpleAuditTransversal implements AbstractAssemblage {
      logs: string[] = [];

      @Before('execution(*.delete)')
      audit(context: AdviceContext) {
        this.logs.push(`[DELETE] ${context.methodName}`);
      }
    }

    @Assemblage()
    class DataService {
      @Affect(SimpleAuditTransversal)
      delete(id: number) {
        return true;
      }
    }

    @Assemblage({
      inject: [[DataService]],
      engage: [[SimpleAuditTransversal]],
    })
    class App implements AbstractAssemblage {
      constructor(
        public dataService: DataService,
        @Context() public context: AssemblerContext
      ) {}
    }

    const app = Assembler.build(App);
    app.dataService.delete(1);

    const auditTransversal = app.context.require(SimpleAuditTransversal);
    expect(auditTransversal.logs).toContain('[DELETE] delete');
  });

  it('should apply pointcut matching with [Abstract, Concrete] binding for execution() patterns', () => {
    // Abstract transversal with execution() pointcut
    abstract class AbstractPointcutTransversal implements AbstractAssemblage {
      abstract logs: string[];
    }

    @Transversal()
    class ConcretePointcutTransversal implements AbstractPointcutTransversal {
      logs: string[] = [];

      // Auto-applied via execution() pattern, not @Affect
      @Before('execution(UserService.create)')
      beforeCreate(context: AdviceContext) {
        this.logs.push(`[AUTO-CREATE] ${context.methodName}`);
      }

      @Before('execution(UserService.update)')
      beforeUpdate(context: AdviceContext) {
        this.logs.push(`[AUTO-UPDATE] ${context.methodName}`);
      }
    }

    @Assemblage()
    class UserService {
      create(name: string) {
        return { id: 1, name };
      }

      update(id: number, name: string) {
        return { id, name };
      }

      delete(id: number) {
        return true;
      }
    }

    @Assemblage({
      inject: [[UserService]],
      engage: [[AbstractPointcutTransversal, ConcretePointcutTransversal]],
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: UserService,
        @Context() public context: AssemblerContext
      ) {}
    }

    const app = Assembler.build(App);

    // These should match the pointcuts (auto-applied)
    app.userService.create('Alice');
    app.userService.update(1, 'Alice Updated');

    // This should NOT match any pointcut
    app.userService.delete(1);

    const pointcutTransversal = app.context.require(AbstractPointcutTransversal);
    expect(pointcutTransversal.logs).toHaveLength(2);
    expect(pointcutTransversal.logs).toContain('[AUTO-CREATE] create');
    expect(pointcutTransversal.logs).toContain('[AUTO-UPDATE] update');
  });

  it('should combine @Affect and execution() pointcuts with [Abstract, Concrete]', () => {
    abstract class AbstractCombinedTransversal implements AbstractAssemblage {
      abstract logs: string[];
    }

    @Transversal()
    class ConcreteCombinedTransversal implements AbstractCombinedTransversal {
      logs: string[] = [];

      // Auto-applied via execution() pattern
      @Before('execution(UserService.*)')
      autoLog(context: AdviceContext) {
        this.logs.push(`[AUTO] ${context.methodName}`);
      }
    }

    @Assemblage()
    class UserService {
      // Only update uses @Affect explicitly
      @Affect(AbstractCombinedTransversal)
      update(id: number, name: string) {
        return { id, name };
      }

      // create relies on execution() pattern only
      create(name: string) {
        return { id: 1, name };
      }
    }

    @Assemblage({
      inject: [[UserService]],
      engage: [[AbstractCombinedTransversal, ConcreteCombinedTransversal]],
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: UserService,
        @Context() public context: AssemblerContext
      ) {}
    }

    const app = Assembler.build(App);

    // Both should apply the transversal
    app.userService.create('Bob');
    app.userService.update(1, 'Bob Updated');

    const combinedTransversal = app.context.require(AbstractCombinedTransversal);
    // create: 1 log via execution() pattern
    // update: 2 logs (1 via execution() pattern + 1 via @Affect)
    expect(combinedTransversal.logs).toHaveLength(3);
    expect(combinedTransversal.logs).toContain('[AUTO] create');
    expect(combinedTransversal.logs.filter(log => log === '[AUTO] update')).toHaveLength(2);
  });
});