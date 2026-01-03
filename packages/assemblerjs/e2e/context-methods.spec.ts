import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { Assembler, Assemblage, AbstractAssemblage, Context, AssemblerContext } from '../src';

describe('Assembler Context Methods', () => {
  it('should check if injectable is registered with has()', () => {
    @Assemblage()
    class TestService implements AbstractAssemblage {
      getValue() {
        return 'test-value';
      }
    }

    @Assemblage({
      inject: [[TestService]],
    })
    class App implements AbstractAssemblage {
      constructor(@Context() public context: AssemblerContext) {}
    }

    const app: App = Assembler.build(App);

    expect(app.context.has(TestService)).toBe(true);
  });

  it('should return concrete class with concrete()', () => {
    @Assemblage()
    class TestService implements AbstractAssemblage {}

    @Assemblage({
      inject: [[TestService]],
    })
    class App implements AbstractAssemblage {
      constructor(@Context() public context: AssemblerContext) {}
    }

    const app: App = Assembler.build(App);

    const concrete = app.context.concrete(TestService);
    expect(concrete).toBe(TestService);
  });

  it('should retrieve tagged instances with tagged()', () => {
    @Assemblage({
      tags: ['api', 'service'],
    })
    class ApiService implements AbstractAssemblage {
      onInit() {}
    }

    @Assemblage({
      tags: ['api', 'controller'],
    })
    class ApiController implements AbstractAssemblage {
      onInit() {}
    }

    @Assemblage({
      tags: 'database',
    })
    class DatabaseService implements AbstractAssemblage {
      onInit() {}
    }

    @Assemblage({
      inject: [[ApiService], [ApiController], [DatabaseService]],
    })
    class App implements AbstractAssemblage {
      constructor(@Context() public context: AssemblerContext) {}
    }

    const app: App = Assembler.build(App);

    const apiInstances = app.context.tagged('api');
    expect(apiInstances).toHaveLength(2);

    const serviceInstances = app.context.tagged('service');
    expect(serviceInstances).toHaveLength(1);

    const databaseInstances = app.context.tagged('database');
    expect(databaseInstances).toHaveLength(1);
  });

  it('should require injectable with configuration', () => {
    @Assemblage()
    class ConfigurableService implements AbstractAssemblage {
      constructor(@Context() public context: AssemblerContext) {}
    }

    @Assemblage({
      inject: [[ConfigurableService, { setting: 'value' }]],
    })
    class App implements AbstractAssemblage {
      constructor(@Context() public context: AssemblerContext) {}
    }

    const app: App = Assembler.build(App);
    
    const instance = app.context.require(ConfigurableService);
    expect(instance).toBeDefined();
  });
});
