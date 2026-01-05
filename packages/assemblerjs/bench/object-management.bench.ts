import 'reflect-metadata';
import { describe, bench } from 'vitest';
import { Assemblage, Assembler, AbstractAssemblage } from '../src';

describe('Object Management Performance', () => {
  describe('Object Creation and Caching', () => {
    bench('Singleton object creation and caching', () => {
      @Assemblage()
      class SingletonObject implements AbstractAssemblage {
        private id = Math.random();

        getId() { return this.id; }
      }

      // Measure singleton caching
      for (let i = 0; i < 1000; i++) {
        const app1 = Assembler.build(SingletonObject);
        const app2 = Assembler.build(SingletonObject);
        if (app1.getId() !== app2.getId()) throw new Error('Singleton caching failed');
      }
    });

    bench('Transient object creation (unique instances)', () => {
      @Assemblage({ singleton: false })
      class TransientObject implements AbstractAssemblage {
        private id = Math.random();

        getId() { return this.id; }
      }

      // Measure transient instance creation
      for (let i = 0; i < 1000; i++) {
        const app1 = Assembler.build(TransientObject);
        const app2 = Assembler.build(TransientObject);
        if (app1.getId() === app2.getId()) throw new Error('Transient uniqueness failed');
      }
    });

    bench('Mixed singleton/transient in same app', () => {
      @Assemblage()
      class SingletonDep implements AbstractAssemblage {
        private id = Math.random();
        getId() { return this.id; }
      }

      @Assemblage({ singleton: false })
      class TransientDep implements AbstractAssemblage {
        private id = Math.random();
        getId() { return this.id; }
      }

      @Assemblage({
        inject: [[SingletonDep], [TransientDep]],
      })
      class MixedApp implements AbstractAssemblage {
        constructor(private singleton: SingletonDep, private transient: TransientDep) {}

        testMixed() {
          return {
            singletonId: this.singleton.getId(),
            transientId: this.transient.getId(),
          };
        }
      }

      let previousSingletonId: number | null = null;
      let previousTransientId: number | null = null;

      // Measure mixed object management
      for (let i = 0; i < 500; i++) {
        const app = Assembler.build(MixedApp);
        const result = app.testMixed();

        // Singleton should be same across builds
        if (previousSingletonId !== null && result.singletonId !== previousSingletonId) {
          throw new Error('Singleton consistency failed');
        }

        // Transient should be different each time
        if (previousTransientId !== null && result.transientId === previousTransientId) {
          throw new Error('Transient uniqueness failed');
        }

        previousSingletonId = result.singletonId;
        previousTransientId = result.transientId;
      }
    });
  });

  describe('Object Lifecycle Management', () => {
    bench('Object disposal and cleanup', () => {
      @Assemblage()
      class DisposableObject implements AbstractAssemblage {
        private disposed = false;

        async onDispose(): Promise<void> {
          this.disposed = true;
        }

        isDisposed() { return this.disposed; }
      }

      // Measure disposal performance
      for (let i = 0; i < 1000; i++) {
        const app = Assembler.build(DisposableObject);
        app.dispose();
        if (!app.isDisposed()) {
          throw new Error('Disposal failed');
        }
      }
    });

    bench('Complex object graph disposal', () => {
      let disposeOrder: string[] = [];

      @Assemblage()
      class LeafObject implements AbstractAssemblage {
        async onDispose(): Promise<void> {
          disposeOrder.push('leaf');
        }
      }

      @Assemblage({ inject: [[LeafObject]] })
      class MiddleObject implements AbstractAssemblage {
        constructor(private leaf: LeafObject) {}

        async onDispose(): Promise<void> {
          disposeOrder.push('middle');
        }
      }

      @Assemblage({ inject: [[MiddleObject]] })
      class RootObject implements AbstractAssemblage {
        constructor(private middle: MiddleObject) {}

        async onDispose(): Promise<void> {
          disposeOrder.push('root');
        }
      }

      // Measure complex disposal order
      for (let i = 0; i < 200; i++) {
        disposeOrder = [];
        const app = Assembler.build(RootObject);
        app.dispose();

        // Should dispose in reverse dependency order: leaf -> middle -> root
        if (disposeOrder.join(',') !== 'leaf,middle,root') {
          throw new Error('Disposal order failed');
        }
      }
    });
  });

  describe('Object Resolution Strategies', () => {
    bench('Direct class resolution', () => {
      @Assemblage()
      class DirectResolutionService implements AbstractAssemblage {
        getType() { return 'direct'; }
      }

      // Measure direct resolution performance
      for (let i = 0; i < 5000; i++) {
        const app = Assembler.build(DirectResolutionService);
        if (app.getType() !== 'direct') throw new Error('Direct resolution failed');
      }
    });

    bench('Interface-based resolution', () => {
      // Using abstract class as interface
      abstract class IService {
        abstract getType(): string;
      }

      @Assemblage()
      class InterfaceService extends IService implements AbstractAssemblage {
        getType() { return 'interface'; }
      }

      @Assemblage({ inject: [[InterfaceService]] })
      class InterfaceApp implements AbstractAssemblage {
        constructor(private service: IService) {}

        testInterface() {
          return this.service.getType();
        }
      }

      // Measure interface resolution performance
      for (let i = 0; i < 5000; i++) {
        const app = Assembler.build(InterfaceApp);
        if (app.testInterface() !== 'interface') throw new Error('Interface resolution failed');
      }
    });

    bench('Factory-based object creation', () => {
      class ManualFactory {
        static createService() {
          return new ManualService();
        }
      }

      class ManualService {
        getType() { return 'factory'; }
      }

      // Measure factory vs DI performance comparison
      for (let i = 0; i < 10000; i++) {
        const service = ManualFactory.createService();
        if (service.getType() !== 'factory') throw new Error('Factory creation failed');
      }
    });
  });

  describe('Memory and Performance Characteristics', () => {
    bench('Memory efficiency (object reuse)', () => {
      @Assemblage()
      class MemoryService implements AbstractAssemblage {
        private data = new Array(1000).fill('data');
      }

      // Measure memory efficiency with singleton reuse
      for (let i = 0; i < 100; i++) {
        const app1 = Assembler.build(MemoryService);
        const app2 = Assembler.build(MemoryService);

        // Should be same instance (memory efficient)
        if (app1 !== app2) throw new Error('Memory efficiency failed');
      }
    });

    bench('Performance scaling with object count', () => {
      // Create multiple objects to test scaling
      const objects: any[] = [];

      for (let i = 0; i < 50; i++) {
        @Assemblage()
        class ScalingService implements AbstractAssemblage {
          private index = i;
          getIndex() { return this.index; }
        }
        objects.push(ScalingService);
      }

      // Build complex app with many dependencies
      @Assemblage({
        inject: objects.map(Obj => [Obj]),
      })
      class ScalingApp implements AbstractAssemblage {
        constructor(...deps: any[]) {
          if (deps.length !== 50) throw new Error('Wrong dependency count');
        }
      }

      // Measure scaling performance
      for (let i = 0; i < 20; i++) {
        const app = Assembler.build(ScalingApp);
        if (!app) throw new Error('Scaling build failed');
      }
    });
  });
});