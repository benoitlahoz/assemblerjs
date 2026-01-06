import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { Assemblage, AbstractAssemblage } from '../src/features/assemblage';
import { Assembler } from '../src/features/assembler';
import { type AssemblerContext } from '../src/features/assembler';
import { Context} from '../src/shared/decorators';
import type { AbstractTransversal } from '../src/features/transversals/model';
import { TransversalManager } from '../src/features/transversals/lib/transversal-manager';
import { Transversal, Before } from '../src/features/transversals';

describe('TransversalManager - Advanced Coverage', () => {
  beforeEach(() => {
    TransversalManager.resetGlobalState();
  });

  describe('resetGlobalState', () => {
    it('should clear all global transversal instances and metadata', () => {
      @Transversal()
      class LoggingTransversal implements AbstractTransversal {
        @Before('execution(*.*)')
        logBefore() {
          console.log('before');
        }
      }

      @Assemblage()
      class TestService {
        execute() {
          return 'test';
        }
      }
      
      @Assemblage({
        inject: [[TestService]],
        engage: [[LoggingTransversal]],
      })
      class App implements AbstractAssemblage {
        constructor(
          public testService: TestService,
          @Context() public context: AssemblerContext
        ) {}
      }

      const app = Assembler.build(App);
      app.testService.execute();

      // Reset should clear everything
      TransversalManager.resetGlobalState();

      // After reset, a new assembler should start fresh
      const app2 = Assembler.build(App);
      const service2 = app2.context.require(TestService);
      expect(service2).toBeDefined();
    });
  });

  describe('getTransversalInstance', () => {
    it('should return transversal instance by class name', () => {
      @Transversal()
      class CachingTransversal implements AbstractTransversal {
        @Before('execution(*.*)')
        cache() {
          console.log('caching');
        }
      }

      @Assemblage()
      class DataService {
        getData() {
          return 'data';
        }
      }

      @Assemblage({
        inject: [[DataService]],
        engage: [[CachingTransversal]],
      })
      class App implements AbstractAssemblage {
        constructor(
          public dataService: DataService,
          @Context() public context: AssemblerContext
        ) {}
      }

      const app = Assembler.build(App);
      const manager = TransversalManager.getInstance(app.context);
      const instance = manager.getTransversalInstance('CachingTransversal');
      
      expect(instance).toBeDefined();
      expect(instance.constructor.name).toBe('CachingTransversal');
    });

    it('should return undefined for non-existent transversal', () => {
      @Assemblage()
      class SimpleService {
        execute() {
          return 'simple';
        }
      }

      @Assemblage({
        inject: [[SimpleService]],
      })
      class App implements AbstractAssemblage {
        constructor(
          public simpleService: SimpleService,
          @Context() public context: AssemblerContext
        ) {}
      }

      const app = Assembler.build(App);
      const manager1 = TransversalManager.getInstance(app.context);
      const manager2 = TransversalManager.getInstance(app.context);
      
      expect(manager1).toBe(manager2);
    });
  });
});
