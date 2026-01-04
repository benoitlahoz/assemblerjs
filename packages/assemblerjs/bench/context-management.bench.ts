import 'reflect-metadata';
import { describe, bench } from 'vitest';
import { Assemblage, Assembler, AbstractAssemblage, Context } from '../src';

describe('Context Management Performance', () => {
  describe('Context Access Performance', () => {
    bench('Context.require() singleton access', () => {
      @Assemblage()
      class SingletonService implements AbstractAssemblage {
        getValue() { return 'singleton'; }
      }

      @Assemblage({
        inject: [[SingletonService]],
      })
      class ContextApp implements AbstractAssemblage {
        constructor(@Context() private context: any, private singleton: SingletonService) {}

        testContextAccess() {
          const service1 = this.context.require(SingletonService);
          const service2 = this.context.require(SingletonService);
          return service1 === service2 && service1.getValue() === 'singleton';
        }
      }

      // Measure context access performance
      for (let i = 0; i < 1000; i++) {
        const app = Assembler.build(ContextApp);
        if (!app.testContextAccess()) throw new Error('Context access failed');
      }
    });

    bench('Context.require() transient access', () => {
      @Assemblage({ singleton: false })
      class TransientService implements AbstractAssemblage {
        private id = Math.random();
        getId() { return this.id; }
      }

      @Assemblage({
        inject: [[TransientService]],
      })
      class TransientContextApp implements AbstractAssemblage {
        constructor(@Context() private context: any, private transient: TransientService) {}

        testTransientContext() {
          const contextInstance = this.context.require(TransientService);
          return contextInstance !== this.transient && contextInstance.getId() !== this.transient.getId();
        }
      }

      // Measure transient context access
      for (let i = 0; i < 1000; i++) {
        const app = Assembler.build(TransientContextApp);
        if (!app.testTransientContext()) throw new Error('Transient context failed');
      }
    });

    bench('Context event subscription', () => {
      @Assemblage({
        events: ['test:event'],
      })
      class EventService implements AbstractAssemblage {
        constructor() {
            //
        }
      }

      @Assemblage({
        inject: [[EventService]],
      })
      class ContextEventApp implements AbstractAssemblage {
        private eventReceived = false;

        constructor(@Context() private context: any, private eventService: EventService) {
          this.context.on('test:event', () => {
            this.eventReceived = true;
          });
        }

        testEvent() {
          this.context.emit('test:event');
          return this.eventReceived;
        }
      }

      // Measure context event performance
      for (let i = 0; i < 1000; i++) {
        const app = Assembler.build(ContextEventApp);
        if (!app.testEvent()) throw new Error('Context event failed');
      }
    });
  });

  describe('Context vs Direct Injection', () => {
    bench('Direct injection access', () => {
      @Assemblage()
      class DirectService implements AbstractAssemblage {
        getValue() { return 'direct'; }
      }

      @Assemblage({
        inject: [[DirectService]],
      })
      class DirectApp implements AbstractAssemblage {
        constructor(private service: DirectService) {}

        testDirect() {
          return this.service.getValue();
        }
      }

      // Measure direct injection performance
      for (let i = 0; i < 10000; i++) {
        const app = Assembler.build(DirectApp);
        if (app.testDirect() !== 'direct') throw new Error('Direct injection failed');
      }
    });

    bench('Context.require() access', () => {
      @Assemblage()
      class ContextService implements AbstractAssemblage {
        getValue() { return 'context'; }
      }

      @Assemblage({
        inject: [[ContextService]],
      })
      class ContextAccessApp implements AbstractAssemblage {
        constructor(@Context() private context: any, private service: ContextService) {}

        testContext() {
          const contextService = this.context.require(ContextService);
          return contextService.getValue();
        }
      }

      // Measure context access performance
      for (let i = 0; i < 10000; i++) {
        const app = Assembler.build(ContextAccessApp);
        if (app.testContext() !== 'context') throw new Error('Context access failed');
      }
    });
  });

  describe('Context Lifecycle Management', () => {
    bench('Context disposal handling', () => {
      @Assemblage()
      class DisposableContextService implements AbstractAssemblage {
        private disposed = false;

        async onDispose(): Promise<void> {
          this.disposed = true;
        }

        isDisposed() { return this.disposed; }
      }

      @Assemblage({
        inject: [[DisposableContextService]],
      })
      class ContextDisposeApp implements AbstractAssemblage {
        constructor(@Context() private context: any, private service: DisposableContextService) {}

        dispose() {
          return this.context.dispose();
        }

        isServiceDisposed() {
          return this.service.isDisposed();
        }
      }

      // Measure context disposal
      for (let i = 0; i < 500; i++) {
        const app = Assembler.build(ContextDisposeApp);
        app.dispose();
        if (!app.isServiceDisposed()) throw new Error('Context dispose failed');
      }
    });

    bench('Context with multiple services', () => {
      @Assemblage() class S1 implements AbstractAssemblage {}
      @Assemblage() class S2 implements AbstractAssemblage {}
      @Assemblage() class S3 implements AbstractAssemblage {}
      @Assemblage() class S4 implements AbstractAssemblage {}
      @Assemblage() class S5 implements AbstractAssemblage {}

      @Assemblage({
        inject: [[S1], [S2], [S3], [S4], [S5]],
      })
      class MultiContextApp implements AbstractAssemblage {
        constructor(@Context() private context: any, private s1: S1, private s2: S2, private s3: S3, private s4: S4, private s5: S5) {}

        testMultiContext() {
          const c1 = this.context.require(S1);
          const c2 = this.context.require(S2);
          const c3 = this.context.require(S3);
          const c4 = this.context.require(S4);
          const c5 = this.context.require(S5);
          return c1 && c2 && c3 && c4 && c5;
        }
      }

      // Measure multi-service context access
      for (let i = 0; i < 200; i++) {
        const app = Assembler.build(MultiContextApp);
        if (!app.testMultiContext()) throw new Error('Multi context failed');
      }
    });
  });
});