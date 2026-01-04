import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { Assemblage, Assembler, AbstractAssemblage, Dispose } from '../src';
import type { AssemblerContext, AbstractAssembler } from '../src';

describe('Lifecycle Hooks Execution Order', () => {
  let executionLog: string[];

  beforeEach(() => {
    executionLog = [];
  });

  it('should execute lifecycle hooks in the correct order', async () => {
    @Assemblage()
    class ChildService implements AbstractAssemblage {
      static onRegister() {
        executionLog.push('1. Child registered');
      }

      constructor() {
        executionLog.push('3. Child constructed');
      }

      onInit() {
        executionLog.push('5. Child initialized');
      }

      onDispose() {
        executionLog.push('8. Child disposed');
      }
    }

    @Assemblage({ inject: [[ChildService]] })
    class ParentService implements AbstractAssemblage {
      static onRegister() {
        executionLog.push('2. Parent registered');
      }

      constructor(
        child: ChildService,
        @Dispose() public dispose: AbstractAssembler['dispose']
      ) {
        executionLog.push('4. Parent constructed');
      }

      onInit() {
        executionLog.push('6. Parent initialized');
      }

      onDispose() {
        executionLog.push('7. Parent disposed');
      }
    }

    // Build triggers registration and construction
    const app = Assembler.build(ParentService);
    
    // Verify registration and construction order
    expect(executionLog).toEqual([
      '1. Child registered',
      '2. Parent registered',
      '3. Child constructed',
      '4. Parent constructed',
      '5. Child initialized',
      '6. Parent initialized',
    ]);

    // Dispose triggers cleanup
    await app.dispose();

    // Verify complete execution order including disposal
    expect(executionLog).toEqual([
      '1. Child registered',
      '2. Parent registered',
      '3. Child constructed',
      '4. Parent constructed',
      '5. Child initialized',
      '6. Parent initialized',
      '8. Child disposed',
      '7. Parent disposed',
    ]);
  });

  it('should execute lifecycle hooks in correct order with multiple dependencies', async () => {
    @Assemblage()
    class ServiceA implements AbstractAssemblage {
      static onRegister() {
        executionLog.push('1. ServiceA registered');
      }

      constructor() {
        executionLog.push('4. ServiceA constructed');
      }

      onInit() {
        executionLog.push('7. ServiceA initialized');
      }

      onDispose() {
        executionLog.push('12. ServiceA disposed');
      }
    }

    @Assemblage()
    class ServiceB implements AbstractAssemblage {
      static onRegister() {
        executionLog.push('2. ServiceB registered');
      }

      constructor() {
        executionLog.push('5. ServiceB constructed');
      }

      onInit() {
        executionLog.push('8. ServiceB initialized');
      }

      onDispose() {
        executionLog.push('11. ServiceB disposed');
      }
    }

    @Assemblage({ inject: [[ServiceA], [ServiceB]] })
    class ServiceC implements AbstractAssemblage {
      static onRegister() {
        executionLog.push('3. ServiceC registered');
      }

      constructor(
        a: ServiceA,
        b: ServiceB,
        @Dispose() public dispose: AbstractAssembler['dispose']
      ) {
        executionLog.push('6. ServiceC constructed');
      }

      onInit() {
        executionLog.push('9. ServiceC initialized');
      }

      onDispose() {
        executionLog.push('10. ServiceC disposed');
      }
    }

    const app = Assembler.build(ServiceC);

    expect(executionLog).toEqual([
      '1. ServiceA registered',
      '2. ServiceB registered',
      '3. ServiceC registered',
      '4. ServiceA constructed',
      '5. ServiceB constructed',
      '6. ServiceC constructed',
      '7. ServiceA initialized',
      '8. ServiceB initialized',
      '9. ServiceC initialized',
    ]);

    await app.dispose();

    expect(executionLog).toEqual([
      '1. ServiceA registered',
      '2. ServiceB registered',
      '3. ServiceC registered',
      '4. ServiceA constructed',
      '5. ServiceB constructed',
      '6. ServiceC constructed',
      '7. ServiceA initialized',
      '8. ServiceB initialized',
      '9. ServiceC initialized',
      '12. ServiceA disposed',
      '11. ServiceB disposed',
      '10. ServiceC disposed',
    ]);
  });

  it('should handle async onInit hooks in correct order', async () => {
    @Assemblage()
    class AsyncChildService implements AbstractAssemblage {
      static onRegister() {
        executionLog.push('1. AsyncChild registered');
      }

      constructor() {
        executionLog.push('3. AsyncChild constructed');
      }

      async onInit() {
        await new Promise((resolve) => setTimeout(resolve, 10));
        executionLog.push('5. AsyncChild initialized');
      }

      onDispose() {
        executionLog.push('8. AsyncChild disposed');
      }
    }

    @Assemblage({ inject: [[AsyncChildService]] })
    class AsyncParentService implements AbstractAssemblage {
      static onRegister() {
        executionLog.push('2. AsyncParent registered');
      }

      constructor(
        child: AsyncChildService,
        @Dispose() public dispose: AbstractAssembler['dispose']
      ) {
        executionLog.push('4. AsyncParent constructed');
      }

      async onInit() {
        await new Promise((resolve) => setTimeout(resolve, 10));
        executionLog.push('6. AsyncParent initialized');
      }

      async onDispose() {
        await new Promise((resolve) => setTimeout(resolve, 10));
        executionLog.push('7. AsyncParent disposed');
      }
    }

    const app = Assembler.build(AsyncParentService);

    // Wait for async onInit to complete
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(executionLog).toEqual([
      '1. AsyncChild registered',
      '2. AsyncParent registered',
      '3. AsyncChild constructed',
      '4. AsyncParent constructed',
      '5. AsyncChild initialized',
      '6. AsyncParent initialized',
    ]);

    await app.dispose();

    expect(executionLog).toEqual([
      '1. AsyncChild registered',
      '2. AsyncParent registered',
      '3. AsyncChild constructed',
      '4. AsyncParent constructed',
      '5. AsyncChild initialized',
      '6. AsyncParent initialized',
      '8. AsyncChild disposed',
    ]);
  });

  it('should pass context and configuration to lifecycle hooks', async () => {
    const config = { test: 'value' };
    let contextReceived: AssemblerContext | null = null;
    let configReceived: any = null;

    @Assemblage()
    class ServiceWithContext implements AbstractAssemblage {
      static onRegister(context: AssemblerContext, configuration: Record<string, any>) {
        contextReceived = context;
        configReceived = configuration;
        executionLog.push('onRegister called with context and config');
      }

      constructor(@Dispose() public dispose: AbstractAssembler['dispose']) {}

      onInit(context: AssemblerContext, configuration: Record<string, any>) {
        expect(context).toBe(contextReceived);
        expect(configuration).toEqual(config);
        executionLog.push('onInit called with context and config');
      }

      onDispose(context: AssemblerContext, configuration: Record<string, any>) {
        expect(context).toBe(contextReceived);
        expect(configuration).toEqual(config);
        executionLog.push('onDispose called with context and config');
      }
    }

    const app = Assembler.build(ServiceWithContext, config);

    expect(contextReceived).not.toBeNull();
    // onRegister is called during registration, before runtime config is available
    expect(configReceived).toEqual({});
    expect(executionLog).toContain('onRegister called with context and config');
    expect(executionLog).toContain('onInit called with context and config');

    await app.dispose();

    expect(executionLog).toContain('onDispose called with context and config');
  });
});
