import 'reflect-metadata';
import { describe, bench } from 'vitest';
import { Assemblage, Assembler, AbstractAssemblage, Context, Dispose } from '../src';

describe('Decorators Performance', () => {
  describe('Assemblage Decorator Performance', () => {
    bench('@Assemblage() decorator application', () => {
      // Measure decorator application overhead
      for (let i = 0; i < 10000; i++) {
        @Assemblage()
        class DecoratedService implements AbstractAssemblage {}

        const instance = new DecoratedService();
        if (!instance) throw new Error('Decorator failed');
      }
    });

    bench('@Assemblage() with complex config', () => {
      // Measure complex decorator configuration
      for (let i = 0; i < 5000; i++) {
        @Assemblage({
          singleton: false,
          inject: [],
          events: ['test:event'],
        })
        class ComplexDecoratedService implements AbstractAssemblage {}

        const instance = new ComplexDecoratedService();
        if (!instance) throw new Error('Complex decorator failed');
      }
    });
  });

  describe('Parameter Decorators Performance', () => {
    bench('@Context() decorator injection', () => {
      @Assemblage()
      class ContextService implements AbstractAssemblage {
        constructor(@Context() private context: any) {}
      }

      // Measure context injection performance
      for (let i = 0; i < 1000; i++) {
        const app = Assembler.build(ContextService);
        if (!app.context) throw new Error('Context injection failed');
      }
    });

    bench('@Dispose() decorator injection', () => {
      @Assemblage()
      class DisposeService implements AbstractAssemblage {
        constructor(@Dispose() private dispose: any) {}
      }

      // Measure dispose injection performance
      for (let i = 0; i < 1000; i++) {
        const app = Assembler.build(DisposeService);
        if (!app.dispose) throw new Error('Dispose injection failed');
      }
    });

    bench('Multiple parameter decorators', () => {
      @Assemblage()
      class BaseService implements AbstractAssemblage {}

      @Assemblage({
        inject: [[BaseService]],
      })
      class MultiDecoratorService implements AbstractAssemblage {
        constructor(
          @Context() private context: any,
          @Dispose() private dispose: any,
          private base: BaseService
        ) {}
      }

      // Measure multiple decorators performance
      for (let i = 0; i < 500; i++) {
        const app = Assembler.build(MultiDecoratorService);
        if (!app.context || !app.dispose || !app.base) {
          throw new Error('Multiple decorators failed');
        }
      }
    });
  });

  describe('Decorator Metadata Performance', () => {
    bench('Decorator metadata reflection', () => {
      // Measure metadata access performance
      for (let i = 0; i < 10000; i++) {
        @Assemblage({
          inject: [],
          events: ['test'],
        })
        class MetadataService implements AbstractAssemblage {}

        const metadata = Reflect.getMetadata('assembler:definition', MetadataService);
        if (!metadata) throw new Error('Metadata not found');
      }
    });

    bench('Complex metadata parsing', () => {
      // Measure complex metadata handling
      for (let i = 0; i < 5000; i++) {
        @Assemblage({
          singleton: false,
          inject: [
            // Simulate complex injection config
            [{ identifier: 'ServiceA' }],
            [{ identifier: 'ServiceB' }],
          ],
          events: ['event1', 'event2', 'event3'],
        })
        class ComplexMetadataService implements AbstractAssemblage {}

        const metadata = Reflect.getMetadata('assembler:definition', ComplexMetadataService);
        if (!metadata?.inject || metadata.inject.length !== 2) {
          throw new Error('Complex metadata failed');
        }
      }
    });
  });

  describe('Decorator vs Manual Performance', () => {
    bench('Decorator-based injection', () => {
      @Assemblage()
      class DepService implements AbstractAssemblage {}

      @Assemblage({ inject: [[DepService]] })
      class DecoratorApp implements AbstractAssemblage {
        constructor(private dep: DepService) {}
      }

      // Measure decorator injection
      for (let i = 0; i < 1000; i++) {
        const app = Assembler.build(DecoratorApp);
        if (!app.dep) throw new Error('Decorator injection failed');
      }
    });

    bench('Manual dependency management (baseline)', () => {
      class ManualDepService {
        constructor() {
            //
        }
      }

      class ManualApp {
        constructor(private dep: ManualDepService) {}

        static create() {
          const dep = new ManualDepService();
          return new ManualApp(dep);
        }
      }

      // Measure manual creation (baseline)
      for (let i = 0; i < 1000; i++) {
        const app = ManualApp.create();
        if (!app.dep) throw new Error('Manual creation failed');
      }
    });
  });
});