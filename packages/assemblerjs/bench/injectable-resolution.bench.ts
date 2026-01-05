import 'reflect-metadata';
import { describe, bench } from 'vitest';
import { Assemblage, Assembler, AbstractAssemblage, Context } from '../src';

// Global test services for realistic benchmarking
@Assemblage()
class SingletonService implements AbstractAssemblage {
  getValue() { return 'singleton'; }
}

@Assemblage()
class SingletonWithDep implements AbstractAssemblage {
  constructor(public dep: SingletonService) {}
  getValue() { return `with-dep:${this.dep.getValue()}`; }
}

@Assemblage({ singleton: false })
class TransientService implements AbstractAssemblage {
  getValue() { return 'transient'; }
}

@Assemblage({ singleton: false })
class TransientWithDep implements AbstractAssemblage {
  constructor(public dep: SingletonService) {}
  getValue() { return `transient-with-dep:${this.dep.getValue()}`; }
}

// Application classes that represent realistic usage
@Assemblage({
  inject: [[SingletonService]],
})
class SingletonApp implements AbstractAssemblage {
  constructor(public singleton: SingletonService) {}
}

@Assemblage({
  inject: [[SingletonWithDep]],
})
class SingletonWithDepApp implements AbstractAssemblage {
  constructor(public service: SingletonWithDep) {}
}

@Assemblage({
  inject: [[TransientService]],
})
class TransientApp implements AbstractAssemblage {
  constructor(public transient: TransientService) {}
}

@Assemblage({
  inject: [[TransientWithDep]],
})
class TransientWithDepApp implements AbstractAssemblage {
  constructor(public service: TransientWithDep) {}
}

@Assemblage({
  inject: [[SingletonService], [TransientService]],
})
class MixedApp implements AbstractAssemblage {
  constructor(
    public singleton: SingletonService,
    public transient: TransientService
  ) {}
}

@Assemblage({
  inject: [[SingletonService], [SingletonWithDep], [TransientService], [TransientWithDep]],
})
class ComplexApp implements AbstractAssemblage {
  constructor(
    @Context() public context: any,
    public singleton: SingletonService,
    public singletonWithDep: SingletonWithDep,
    public transient: TransientService,
    public transientWithDep: TransientWithDep
  ) {}
}

describe('Injectable Resolution Performance', () => {
  describe('Singleton Resolution', () => {
    bench('Access singleton service (no dependencies)', () => {
      const app = Assembler.build(SingletonApp);
      // Measure access to injected singleton service
      const value = app.singleton.getValue();
      if (value !== 'singleton') throw new Error('Access failed');
    });

    bench('Access singleton service with dependencies', () => {
      const app = Assembler.build(SingletonWithDepApp);
      // Measure access to injected singleton service with dependencies
      const value = app.service.getValue();
      if (value !== 'with-dep:singleton') throw new Error('Access failed');
    });

    bench('Multiple accesses to same singleton (cache test)', () => {
      const app = Assembler.build(SingletonApp);
      // Measure multiple accesses to test singleton caching
      for (let i = 0; i < 100; i++) {
        const value = app.singleton.getValue();
        if (value !== 'singleton') throw new Error('Access failed');
      }
    });
  });

  describe('Transient Resolution', () => {
    bench('Access transient service (no dependencies)', () => {
      const app = Assembler.build(TransientApp);
      const value = app.transient.getValue();
      if (value !== 'transient') throw new Error('Access failed');
    });

    bench('Access transient service with dependencies', () => {
      const app = Assembler.build(TransientWithDepApp);
      const value = app.service.getValue();
      if (value !== 'transient-with-dep:singleton') throw new Error('Access failed');
    });

    bench('Multiple transient instances creation', () => {
      // Create multiple instances to test transient behavior
      for (let i = 0; i < 100; i++) {
        const app = Assembler.build(TransientApp);
        const value = app.transient.getValue();
        if (value !== 'transient') throw new Error('Access failed');
      }
    });
  });

  describe('Mixed Singleton/Transient Resolution', () => {
    bench('Access mixed singleton and transient services', () => {
      const app = Assembler.build(MixedApp);
      // Access both singleton and transient
      const singletonValue = app.singleton.getValue();
      const transientValue = app.transient.getValue();
      if (singletonValue !== 'singleton' || transientValue !== 'transient') {
        throw new Error('Access failed');
      }
    });

    bench('Multiple accesses to mixed services', () => {
      const app = Assembler.build(MixedApp);
      // Measure multiple accesses to both types
      for (let i = 0; i < 50; i++) {
        const singletonValue = app.singleton.getValue();
        const transientValue = app.transient.getValue();
        if (singletonValue !== 'singleton' || transientValue !== 'transient') {
          throw new Error('Access failed');
        }
      }
    });
  });

  describe('Context Access Performance', () => {
    bench('Access service via context.require() (singleton)', () => {
      const app = Assembler.build(ComplexApp);
      // Measure context access to singleton
      const service = app.context.require(SingletonService);
      const value = service.getValue();
      if (value !== 'singleton') throw new Error('Context access failed');
    });

    bench('Access service via context.require() (transient)', () => {
      const app = Assembler.build(ComplexApp);
      // Measure context access to transient (should get new instance)
      const service1 = app.context.require(TransientService);
      const service2 = app.context.require(TransientService);
      if (service1 === service2) throw new Error('Transient should create new instances');
      const value1 = service1.getValue();
      const value2 = service2.getValue();
      if (value1 !== 'transient' || value2 !== 'transient') throw new Error('Context access failed');
    });

    bench('Multiple context.require() calls (cache test)', () => {
      const app = Assembler.build(ComplexApp);
      // Measure multiple context accesses to singleton
      for (let i = 0; i < 100; i++) {
        const service = app.context.require(SingletonService);
        const value = service.getValue();
        if (value !== 'singleton') throw new Error('Context access failed');
      }
    });

    bench('Complex context access pattern', () => {
      const app = Assembler.build(ComplexApp);
      // Measure complex access pattern mixing direct injection and context access
      const directSingleton = app.singleton.getValue();
      const contextSingleton = app.context.require(SingletonService).getValue();
      const contextTransient1 = app.context.require(TransientService).getValue();
      const contextTransient2 = app.context.require(TransientService).getValue();

      if (directSingleton !== 'singleton' ||
          contextSingleton !== 'singleton' ||
          contextTransient1 !== 'transient' ||
          contextTransient2 !== 'transient') {
        throw new Error('Complex access failed');
      }
    });
  });

  describe('Dependency Tree Building', () => {
    bench('Build simple application (1 service)', () => {
      const app = Assembler.build(SingletonApp);
      if (!app.singleton) throw new Error('Build failed');
    });

    bench('Build application with dependency chain (2 levels)', () => {
      const app = Assembler.build(SingletonWithDepApp);
      if (!app.service || !app.service.dep) throw new Error('Build failed');
    });

    bench('Build complex application (4 services)', () => {
      const app = Assembler.build(ComplexApp);
      if (!app.singleton || !app.singletonWithDep || !app.transient || !app.transientWithDep) {
        throw new Error('Build failed');
      }
    });
  });
});
