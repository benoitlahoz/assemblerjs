import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { TransversalManager, Transversal, Before, Assemblage, AbstractAssemblage, Assembler, Context } from '../src';
import type { AssemblerContext } from '../src';

@Assemblage()
class TestApp {
  constructor(@Context() public context: AssemblerContext) {}
}

describe('TransversalManager - Branch Coverage', () => {
  beforeEach(() => {
    TransversalManager.resetGlobalState();
  });

  describe('registerTransversal - configuration branches', () => {
    it('should handle [TransversalClass, config] tuple', () => {
      @Transversal()
      class SimpleTransversal implements AbstractAssemblage {
        @Before('execution(*.*)')
        before() {}
      }

      @Assemblage({ engage: [[SimpleTransversal]] })
      class App {
        constructor(@Context() public context: AssemblerContext) {}
      }

      const app = Assembler.build(App);
      const manager = TransversalManager.getInstance(app.context);

      // Tuple with config - registers with priority
      manager.registerTransversal([SimpleTransversal, { priority: 10 }]);

      const instance = manager.getTransversalInstance('SimpleTransversal');
      expect(instance).toBeDefined();
    });

    it('should handle [AbstractClass, ConcreteClass] tuple', () => {
      abstract class AbstractTransversal implements AbstractAssemblage {
        abstract doWork(): void;
      }

      @Transversal()
      class ConcreteTransversal implements AbstractTransversal {
        doWork() {}
        @Before('execution(*.*)')
        before() {}
      }

      @Assemblage({ engage: [[ConcreteTransversal]] })
      class App {
        constructor(@Context() public context: AssemblerContext) {}
      }

      const app = Assembler.build(App);
      const manager = TransversalManager.getInstance(app.context);

      // Tuple with abstraction
      manager.registerTransversal([AbstractTransversal, ConcreteTransversal]);

      const instance = manager.getTransversalInstance('ConcreteTransversal');
      expect(instance).toBeDefined();
    });

    it('should handle [AbstractClass, ConcreteClass, config] tuple', () => {
      abstract class AbstractTransversal implements AbstractAssemblage {
        abstract doWork(): void;
      }

      @Transversal()
      class ConcreteTransversal implements AbstractTransversal {
        doWork() {}
        @Before('execution(*.*)')
        before() {}
      }

      @Assemblage({ engage: [[ConcreteTransversal]] })
      class App {
        constructor(@Context() public context: AssemblerContext) {}
      }

      const app = Assembler.build(App);
      const manager = TransversalManager.getInstance(app.context);

      // Tuple with abstraction and config
      manager.registerTransversal([
        AbstractTransversal,
        ConcreteTransversal,
        { priority: 5 },
      ]);

      const instance = manager.getTransversalInstance('ConcreteTransversal');
      expect(instance).toBeDefined();
    });
  });

  describe('registerTransversal - error validation', () => {
    it('should throw when transversal is not decorated', () => {
      class NotDecorated implements AbstractAssemblage {}

      const app = Assembler.build(TestApp);
      const manager = TransversalManager.getInstance(app.context);

      expect(() => {
        manager.registerTransversal([NotDecorated]);
      }).toThrow();
    });
  });

  describe('getInstance - singleton behavior', () => {
    it('should return same instance for same context', () => {
      const app = Assembler.build(TestApp);

      const manager1 = TransversalManager.getInstance(app.context);
      const manager2 = TransversalManager.getInstance(app.context);

      expect(manager1).toBe(manager2);
    });

    it('should return different instances for different contexts', () => {
      const app1 = Assembler.build(TestApp);
      const app2 = Assembler.build(TestApp);

      const manager1 = TransversalManager.getInstance(app1.context);
      const manager2 = TransversalManager.getInstance(app2.context);

      expect(manager1).not.toBe(manager2);
    });
  });
});
