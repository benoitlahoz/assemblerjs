import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { Assemblage, Assembler, AbstractAssemblage, Context, Transversal, Before, TransversalManager, type AssemblerContext, type AdviceContext } from '../src';

describe('AOP (Transversals) - Caller Tracking', () => {
  beforeEach(() => {
    TransversalManager.resetGlobalState();
  });

  it('should track the caller in JoinPoint when calling from assemblage', () => {
    const callLog: any[] = [];

    @Transversal()
    class CallerTrackingTransversal {
      @Before('execution(*.execute)')
      logCaller(context: AdviceContext) {
        callLog.push({
          methodName: context.methodName,
          caller: context.caller,
          callerIdentifier: context.callerIdentifier,
        });
      }
    }

    @Assemblage()
    class ServiceA {
      execute() {
        return 'executed in ServiceA';
      }
    }

    @Assemblage()
    class ServiceB {
      execute() {
        return 'executed in ServiceB';
      }
    }

    @Assemblage({
      inject: [[ServiceA], [ServiceB]],
      engage: [[CallerTrackingTransversal]],
    })
    class App implements AbstractAssemblage {
      constructor(
        public serviceA: ServiceA,
        public serviceB: ServiceB,
        @Context() public context: AssemblerContext
      ) {}
    }

    const app = Assembler.build(App);

    // Call from serviceA
    app.serviceA.execute();
    expect(callLog).toContainEqual(
      expect.objectContaining({
        methodName: 'execute',
        caller: 'ServiceA',
        callerIdentifier: 'ServiceA',
      })
    );

    // Call from serviceB
    app.serviceB.execute();
    const lastCall = callLog[callLog.length - 1];
    expect(lastCall).toEqual(
      expect.objectContaining({
        methodName: 'execute',
        caller: 'ServiceB',
        callerIdentifier: 'ServiceB',
      })
    );
  });

  it('should track nested calls with proper caller info', () => {
    const callLog: any[] = [];

    @Transversal()
    class CallerTrackingTransversal {
      @Before('execution(*.*)')
      logCaller(context: AdviceContext) {
        callLog.push({
          methodName: context.methodName,
          caller: context.caller,
        });
      }
    }

    @Assemblage()
    class InnerService {
      process() {
        return 'inner';
      }
    }

    @Assemblage()
    class OuterService {
      constructor(private inner: InnerService) {}

      execute() {
        return this.inner.process();
      }
    }

    @Assemblage({
      inject: [[InnerService], [OuterService]],
      engage: [[CallerTrackingTransversal]],
    })
    class App implements AbstractAssemblage {
      constructor(
        public outer: OuterService,
        @Context() public context: AssemblerContext
      ) {}
    }

    const app = Assembler.build(App);
    app.outer.execute();

    // Should have tracked both calls
    expect(callLog.length).toBeGreaterThan(0);
    expect(callLog.some(call => call.caller === 'OuterService')).toBe(true);
  });
});
