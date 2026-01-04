import 'reflect-metadata';
import { describe, bench } from 'vitest';
import { Assemblage, Assembler, AbstractAssemblage } from '../src';

describe('Lifecycle Hooks Performance', () => {
  describe('Hook Execution Performance', () => {
    bench('onInit hook execution (single service)', () => {
      @Assemblage()
      class HookService implements AbstractAssemblage {
        private value = 0;

        async onInit(): Promise<void> {
          this.value = 42;
        }
      }

      // Measure hook execution time
      for (let i = 0; i < 1000; i++) {
        const app = Assembler.build(HookService);
        if (app.value !== 42) throw new Error('Hook not executed');
      }
    });

    bench('onInit hook execution (complex app with 5 services)', () => {
      @Assemblage()
      class Service1 implements AbstractAssemblage {
        async onInit(): Promise<void> { /* hook */ }
      }

      @Assemblage()
      class Service2 implements AbstractAssemblage {
        async onInit(): Promise<void> { /* hook */ }
      }

      @Assemblage()
      class Service3 implements AbstractAssemblage {
        async onInit(): Promise<void> { /* hook */ }
      }

      @Assemblage()
      class Service4 implements AbstractAssemblage {
        async onInit(): Promise<void> { /* hook */ }
      }

      @Assemblage({
        inject: [[Service1], [Service2], [Service3], [Service4]],
      })
      class ComplexApp implements AbstractAssemblage {
        constructor(
          private s1: Service1,
          private s2: Service2,
          private s3: Service3,
          private s4: Service4
        ) {}

        async onInit(): Promise<void> { /* hook */ }
      }

      // Measure complex hook execution
      for (let i = 0; i < 100; i++) {
        const app = Assembler.build(ComplexApp);
        if (!app.s1 || !app.s2 || !app.s3 || !app.s4) throw new Error('Build failed');
      }
    });

    bench('onDispose hook execution', () => {
      @Assemblage()
      class DisposableService implements AbstractAssemblage {
        private disposed = false;

        async onDispose(): Promise<void> {
          this.disposed = true;
        }
      }

      // Measure dispose execution
      for (let i = 0; i < 1000; i++) {
        const app = Assembler.build(DisposableService);
        app.dispose();
        if (!app.disposed) throw new Error('Dispose hook not executed');
      }
    });
  });

  describe('Hook Order and Timing', () => {
    bench('Hook execution order (3 level dependency chain)', () => {
      const executionOrder: string[] = [];

      @Assemblage()
      class Level3Service implements AbstractAssemblage {
        async onInit(): Promise<void> {
          executionOrder.push('level3');
        }
      }

      @Assemblage({
        inject: [[Level3Service]],
      })
      class Level2Service implements AbstractAssemblage {
        constructor(private level3: Level3Service) {}

        async onInit(): Promise<void> {
          executionOrder.push('level2');
        }
      }

      @Assemblage({
        inject: [[Level2Service]],
      })
      class Level1App implements AbstractAssemblage {
        constructor(private level2: Level2Service) {}

        async onInit(): Promise<void> {
          executionOrder.push('level1');
        }
      }

      // Measure hook order execution
      for (let i = 0; i < 500; i++) {
        executionOrder.length = 0; // Reset
        Assembler.build(Level1App);
        if (executionOrder.join(',') !== 'level3,level2,level1') {
          throw new Error('Wrong execution order');
        }
      }
    });
  });
});