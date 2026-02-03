import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { Assemblage, Assembler, AbstractAssemblage, Context, Transversal, Before, TransversalManager, TransversalWeaver, type AssemblerContext, type AdviceContext } from '../src';

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

  it('should work with withCaller even without any Transversal engaged', () => {
    @Assemblage()
    class UserService {
      save(name: string) {
        return `User ${name} saved`;
      }
    }

    @Assemblage({
      inject: [[UserService]],
      // No engage! No Transversal
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: UserService,
        @Context() public context: AssemblerContext
      ) {}
    }

    const app = Assembler.build(App);

    // Call from Vue component context
    TransversalWeaver.withCaller('VueComponent', () => {
      app.userService.save('John');
      
      // Can still access caller context directly
      const caller = TransversalWeaver.getCurrentCaller();
      expect(caller?.className).toBe('VueComponent');
    });
  });

  it('should support identifier in withCaller', () => {
    @Assemblage()
    class UserService {
      save(name: string) {
        return `User ${name} saved`;
      }
    }

    @Assemblage({
      inject: [[UserService]],
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: UserService,
        @Context() public context: AssemblerContext
      ) {}
    }

    Assembler.build(App);

    TransversalWeaver.withCaller('MyService', 'custom-identifier', () => {
      const caller = TransversalWeaver.getCurrentCaller();
      expect(caller?.className).toBe('MyService');
      expect(caller?.identifier).toBe('custom-identifier');
    });
  });

  it('should handle async functions in withCaller', async () => {
    @Assemblage()
    class UserService {
      async save(name: string) {
        return `User ${name} saved`;
      }
    }

    @Assemblage({
      inject: [[UserService]],
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: UserService,
        @Context() public context: AssemblerContext
      ) {}
    }

    const app = Assembler.build(App);

    await TransversalWeaver.withCaller('AsyncCaller', async () => {
      const result = await app.userService.save('John');
      expect(result).toBe('User John saved');
      
      // Caller should still be active during the promise
      const caller = TransversalWeaver.getCurrentCaller();
      expect(caller?.className).toBe('AsyncCaller');
    });

    // Caller should be cleared after the promise resolves
    const callerAfter = TransversalWeaver.getCurrentCaller();
    expect(callerAfter).toBeUndefined();
  });

  it('should wrap a function with caller context using wrapCaller', () => {
    const callLog: any[] = [];

    @Transversal()
    class CallerTrackingTransversal {
      @Before('execution(*.mergeClasses)')
      logCaller(context: AdviceContext) {
        callLog.push({
          methodName: context.methodName,
          caller: context.caller,
          callerIdentifier: context.callerIdentifier,
        });
      }
    }

    @Assemblage()
    class TailwindService {
      mergeClasses(...args: any[]) {
        return args.join(' ');
      }
    }

    @Assemblage({
      inject: [[TailwindService]],
      engage: [[CallerTrackingTransversal]],
    })
    class App implements AbstractAssemblage {
      constructor(
        public tailwind: TailwindService,
        @Context() public context: AssemblerContext
      ) {}
    }

    const app = Assembler.build(App);

    // Create wrapped function
    const mergeClasses = TransversalWeaver.wrapCaller(
      'LeafletMap',
      'LeafletMap.vue',
      (...args: any[]) => app.tailwind.mergeClasses(...args)
    );

    // Call it multiple times
    const result1 = mergeClasses('class1', 'class2');
    expect(result1).toBe('class1 class2');

    const result2 = mergeClasses('class3', 'class4');
    expect(result2).toBe('class3 class4');

    // Both calls should have tracked the caller
    expect(callLog.length).toBe(2);
    expect(callLog[0]).toEqual({
      methodName: 'mergeClasses',
      caller: 'LeafletMap',
      callerIdentifier: 'LeafletMap.vue',
    });
    expect(callLog[1]).toEqual({
      methodName: 'mergeClasses',
      caller: 'LeafletMap',
      callerIdentifier: 'LeafletMap.vue',
    });
  });

  it('should handle async functions in wrapCaller', async () => {
    const callLog: any[] = [];

    @Transversal()
    class CallerTrackingTransversal {
      @Before('execution(*.save)')
      logCaller(context: AdviceContext) {
        callLog.push({
          methodName: context.methodName,
          caller: context.caller,
        });
      }
    }

    @Assemblage()
    class UserService {
      async save(name: string) {
        return `User ${name} saved`;
      }
    }

    @Assemblage({
      inject: [[UserService]],
      engage: [[CallerTrackingTransversal]],
    })
    class App implements AbstractAssemblage {
      constructor(
        public userService: UserService,
        @Context() public context: AssemblerContext
      ) {}
    }

    const app = Assembler.build(App);

    // Create wrapped async function
    const saveUser = TransversalWeaver.wrapCaller(
      'UserEditComponent',
      async (name: string) => await app.userService.save(name)
    );

    const result = await saveUser('John');
    expect(result).toBe('User John saved');

    // Should have tracked the caller
    expect(callLog.length).toBe(1);
    expect(callLog[0]).toEqual({
      methodName: 'save',
      caller: 'UserEditComponent',
    });

    // Caller should be cleared after async execution
    const callerAfter = TransversalWeaver.getCurrentCaller();
    expect(callerAfter).toBeUndefined();
  });

  it('should handle errors in wrapCaller and still clean up context', () => {
    @Assemblage()
    class ErrorService {
      throwError() {
        throw new Error('Test error');
      }
    }

    @Assemblage({
      inject: [[ErrorService]],
    })
    class App implements AbstractAssemblage {
      constructor(
        public errorService: ErrorService,
        @Context() public context: AssemblerContext
      ) {}
    }

    const app = Assembler.build(App);

    const wrappedThrow = TransversalWeaver.wrapCaller(
      'ErrorComponent',
      () => app.errorService.throwError()
    );

    expect(() => wrappedThrow()).toThrow('Test error');

    // Caller should be cleared even after error
    const callerAfter = TransversalWeaver.getCurrentCaller();
    expect(callerAfter).toBeUndefined();
  });
});
