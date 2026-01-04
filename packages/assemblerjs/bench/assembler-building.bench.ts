import 'reflect-metadata';
import { describe, bench } from 'vitest';
import { Assemblage, Assembler, AbstractAssemblage } from '../src';

describe('Assembler Building Performance', () => {
  describe('Application Size Scaling', () => {
    bench('Build tiny application (1 service)', () => {
      @Assemblage()
      class TinyService implements AbstractAssemblage {}

      for (let i = 0; i < 1000; i++) {
        const app = Assembler.build(TinyService);
        if (!app) throw new Error('Build failed');
      }
    });

    bench('Build small application (3 services)', () => {
      @Assemblage()
      class ServiceA implements AbstractAssemblage {}

      @Assemblage()
      class ServiceB implements AbstractAssemblage {}

      @Assemblage({
        inject: [[ServiceA], [ServiceB]],
      })
      class SmallApp implements AbstractAssemblage {
        constructor(private a: ServiceA, private b: ServiceB) {}
      }

      for (let i = 0; i < 500; i++) {
        const app = Assembler.build(SmallApp);
        if (!app.a || !app.b) throw new Error('Build failed');
      }
    });

    bench('Build medium application (10 services)', () => {
      // Create 9 services
      @Assemblage()
      class S1 implements AbstractAssemblage {}
      @Assemblage()
      class S2 implements AbstractAssemblage {}
      @Assemblage()
      class S3 implements AbstractAssemblage {}
      @Assemblage()
      class S4 implements AbstractAssemblage {}
      @Assemblage()
      class S5 implements AbstractAssemblage {}
      @Assemblage()
      class S6 implements AbstractAssemblage {}
      @Assemblage()
      class S7 implements AbstractAssemblage {}
      @Assemblage()
      class S8 implements AbstractAssemblage {}
      @Assemblage()
      class S9 implements AbstractAssemblage {}

      @Assemblage({
        inject: [[S1], [S2], [S3], [S4], [S5], [S6], [S7], [S8], [S9]],
      })
      class MediumApp implements AbstractAssemblage {
        constructor(
          private s1: S1, private s2: S2, private s3: S3, private s4: S4, private s5: S5,
          private s6: S6, private s7: S7, private s8: S8, private s9: S9
        ) {}
      }

      for (let i = 0; i < 100; i++) {
        const app = Assembler.build(MediumApp);
        if (!app.s1 || !app.s9) throw new Error('Build failed');
      }
    });

    bench('Build large application (25 services)', () => {
      // Create 24 services (simplified for benchmark)
      const services: any[] = [];
      for (let i = 0; i < 24; i++) {
        @Assemblage()
        class Service implements AbstractAssemblage {}
        services.push(Service);
      }

      @Assemblage({
        inject: services.map(S => [S]),
      })
      class LargeApp implements AbstractAssemblage {
        constructor(...deps: any[]) {
          if (deps.length !== 24) throw new Error('Wrong dependency count');
        }
      }

      for (let i = 0; i < 50; i++) {
        const app = Assembler.build(LargeApp);
        if (!app) throw new Error('Build failed');
      }
    });
  });

  describe('Dependency Tree Complexity', () => {
    bench('Build deep dependency tree (5 levels)', () => {
      @Assemblage()
      class Level5 implements AbstractAssemblage {}

      @Assemblage({ inject: [[Level5]] })
      class Level4 implements AbstractAssemblage {
        constructor(private l5: Level5) {}
      }

      @Assemblage({ inject: [[Level4]] })
      class Level3 implements AbstractAssemblage {
        constructor(private l4: Level4) {}
      }

      @Assemblage({ inject: [[Level3]] })
      class Level2 implements AbstractAssemblage {
        constructor(private l3: Level3) {}
      }

      @Assemblage({ inject: [[Level2]] })
      class DeepApp implements AbstractAssemblage {
        constructor(private l2: Level2) {}
      }

      for (let i = 0; i < 200; i++) {
        const app = Assembler.build(DeepApp);
        if (!app.l2?.l3?.l4?.l5) throw new Error('Build failed');
      }
    });

    bench('Build wide dependency tree (10 parallel deps)', () => {
      // Create 10 independent services
      @Assemblage() class A1 implements AbstractAssemblage {}
      @Assemblage() class A2 implements AbstractAssemblage {}
      @Assemblage() class A3 implements AbstractAssemblage {}
      @Assemblage() class A4 implements AbstractAssemblage {}
      @Assemblage() class A5 implements AbstractAssemblage {}
      @Assemblage() class A6 implements AbstractAssemblage {}
      @Assemblage() class A7 implements AbstractAssemblage {}
      @Assemblage() class A8 implements AbstractAssemblage {}
      @Assemblage() class A9 implements AbstractAssemblage {}
      @Assemblage() class A10 implements AbstractAssemblage {}

      @Assemblage({
        inject: [[A1], [A2], [A3], [A4], [A5], [A6], [A7], [A8], [A9], [A10]],
      })
      class WideApp implements AbstractAssemblage {
        constructor(
          private a1: A1, private a2: A2, private a3: A3, private a4: A4, private a5: A5,
          private a6: A6, private a7: A7, private a8: A8, private a9: A9, private a10: A10
        ) {}
      }

      for (let i = 0; i < 100; i++) {
        const app = Assembler.build(WideApp);
        if (!app.a1 || !app.a10) throw new Error('Build failed');
      }
    });
  });

  describe('Build vs Runtime Performance', () => {
    bench('Assembler.build() cold start', () => {
      @Assemblage()
      class ColdService implements AbstractAssemblage {}

      // Measure cold build performance
      for (let i = 0; i < 1000; i++) {
        const app = Assembler.build(ColdService);
        if (!app) throw new Error('Build failed');
      }
    });

    bench('Assembler.build() with complex resolution', () => {
      @Assemblage()
      class BaseService implements AbstractAssemblage {
        getData() { return 'data'; }
      }

      @Assemblage({ inject: [[BaseService]] })
      class ComplexService implements AbstractAssemblage {
        constructor(private base: BaseService) {}
        process() { return this.base.getData().toUpperCase(); }
      }

      // Measure complex resolution performance
      for (let i = 0; i < 500; i++) {
        const app = Assembler.build(ComplexService);
        if (app.process() !== 'DATA') throw new Error('Resolution failed');
      }
    });
  });
});