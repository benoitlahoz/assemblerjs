import 'reflect-metadata';
import { describe, bench } from 'vitest';
import { Assemblage, Assembler, AbstractAssemblage, Context } from '../src';

describe('Advanced Features Performance', () => {
  describe('Tags System Performance', () => {
    bench('Service tagging and retrieval', () => {
      @Assemblage({ tags: ['database', 'mysql'] })
      class DatabaseService implements AbstractAssemblage {
        connect() { return 'connected'; }
      }

      @Assemblage({ tags: ['cache', 'redis'] })
      class CacheService implements AbstractAssemblage {
        get(key: string) { return `value:${key}`; }
      }

      @Assemblage({ tags: ['logger', 'file'] })
      class LoggerService implements AbstractAssemblage {
        log(message: string) { return `logged:${message}`; }
      }

      @Assemblage({
        inject: [[DatabaseService], [CacheService], [LoggerService]],
      })
      class TaggedApp implements AbstractAssemblage {
        constructor(
          @Context() private context: any,
          private db: DatabaseService,
          private cache: CacheService,
          private logger: LoggerService
        ) {}

        testTags() {
          const databases = this.context.tagged('database');
          const caches = this.context.tagged('cache');
          const loggers = this.context.tagged('logger');
          const mysqlServices = this.context.tagged('mysql');

          return {
            databases: databases.length,
            caches: caches.length,
            loggers: loggers.length,
            mysql: mysqlServices.length,
          };
        }
      }

      // Measure tagging performance
      for (let i = 0; i < 500; i++) {
        const app = Assembler.build(TaggedApp);
        const result = app.testTags();

        if (result.databases !== 1 || result.caches !== 1 || result.loggers !== 1 || result.mysql !== 1) {
          throw new Error('Tagging failed');
        }
      }
    });

    bench('Multiple tags per service', () => {
      @Assemblage({ tags: ['api', 'http', 'rest', 'v1'] })
      class ApiService implements AbstractAssemblage {
        handleRequest() { return 'response'; }
      }

      @Assemblage({
        inject: [[ApiService]],
      })
      class MultiTagApp implements AbstractAssemblage {
        constructor(@Context() private context: any, private api: ApiService) {}

        testMultiTags() {
          const apis = this.context.tagged('api');
          const https = this.context.tagged('http');
          const rests = this.context.tagged('rest');
          const v1s = this.context.tagged('v1');

          return apis.length === 1 && https.length === 1 && rests.length === 1 && v1s.length === 1;
        }
      }

      // Measure multi-tag performance
      for (let i = 0; i < 500; i++) {
        const app = Assembler.build(MultiTagApp);
        if (!app.testMultiTags()) throw new Error('Multi-tag failed');
      }
    });

    bench('Tag-based service discovery', () => {
      // Create multiple services with different tags
      @Assemblage({ tags: ['worker', 'background'] })
      class Worker1 implements AbstractAssemblage {}
      @Assemblage({ tags: ['worker', 'priority'] })
      class Worker2 implements AbstractAssemblage {}
      @Assemblage({ tags: ['worker', 'background'] })
      class Worker3 implements AbstractAssemblage {}
      @Assemblage({ tags: ['scheduler'] })
      class Scheduler implements AbstractAssemblage {}

      @Assemblage({
        inject: [[Worker1], [Worker2], [Worker3], [Scheduler]],
      })
      class TagDiscoveryApp implements AbstractAssemblage {
        constructor(@Context() private context: any) {}

        discoverServices() {
          const allWorkers = this.context.tagged('worker');
          const backgroundWorkers = this.context.tagged('background');
          const priorityWorkers = this.context.tagged('priority');
          const schedulers = this.context.tagged('scheduler');

          return {
            allWorkers: allWorkers.length,
            backgroundWorkers: backgroundWorkers.length,
            priorityWorkers: priorityWorkers.length,
            schedulers: schedulers.length,
          };
        }
      }

      // Measure tag discovery performance
      for (let i = 0; i < 200; i++) {
        const app = Assembler.build(TagDiscoveryApp);
        const result = app.discoverServices();

        if (result.allWorkers !== 3 || result.backgroundWorkers !== 2 ||
            result.priorityWorkers !== 1 || result.schedulers !== 1) {
          throw new Error('Tag discovery failed');
        }
      }
    });
  });

  describe('Scope and Isolation Performance', () => {
    bench('Scoped assembler instances', () => {
      @Assemblage()
      class ScopedService implements AbstractAssemblage {
        private id = Math.random();
        getId() { return this.id; }
      }

      // Measure scoped instance isolation
      for (let i = 0; i < 500; i++) {
        const app1 = Assembler.build(ScopedService);
        const app2 = Assembler.build(ScopedService);

        // Different assembler instances should have different services
        if (app1.getId() === app2.getId()) {
          throw new Error('Scope isolation failed');
        }
      }
    });

    bench('Singleton across scopes', () => {
      @Assemblage()
      class GlobalSingleton implements AbstractAssemblage {
        private static instance: GlobalSingleton;
        private id = Math.random();

        constructor() {
          if (GlobalSingleton.instance) {
            return GlobalSingleton.instance;
          }
          GlobalSingleton.instance = this;
        }

        getId() { return this.id; }
      }

      // Measure singleton consistency across scopes
      for (let i = 0; i < 500; i++) {
        const app1 = Assembler.build(GlobalSingleton);
        const app2 = Assembler.build(GlobalSingleton);

        // Should be same instance across builds
        if (app1.getId() !== app2.getId()) {
          throw new Error('Singleton consistency failed');
        }
      }
    });
  });

  describe('Error Handling and Resilience', () => {
    bench('Error in constructor handling', () => {
      let errorCount = 0;

      @Assemblage()
      class ErrorService implements AbstractAssemblage {
        constructor() {
          errorCount++;
          if (errorCount % 10 === 0) { // Error every 10th instance
            throw new Error('Constructor error');
          }
        }
      }

      // Measure error handling performance (should not crash)
      for (let i = 0; i < 100; i++) {
        try {
          Assembler.build(ErrorService);
        } catch (error) {
          // Expected error handling
          if (!(error instanceof Error) || !error.message.includes('Constructor error')) {
            throw new Error('Unexpected error');
          }
        }
      }
    });

    bench('Hook error resilience', () => {
      let initCallCount = 0;

      @Assemblage()
      class HookErrorService implements AbstractAssemblage {
        onInit(): void {
          initCallCount++;
          if (initCallCount % 5 === 0) { // Error every 5th init
            throw new Error('Init hook error');
          }
        }
      }

      // Measure hook error handling
      for (let i = 0; i < 50; i++) {
        try {
          Assembler.build(HookErrorService);
        } catch (error) {
          if (!(error instanceof Error) || !error.message.includes('Init hook error')) {
            throw new Error('Unexpected hook error');
          }
        }
      }
    });
  });

  describe('Metadata and Reflection Performance', () => {
    bench('Assemblage metadata access', () => {
      // Measure metadata access performance
      for (let i = 0; i < 10000; i++) {
        @Assemblage({
          singleton: true,
          tags: ['test', 'metadata'],
          inject: [],
          events: ['meta:event'],
        })
        class MetadataService implements AbstractAssemblage {}

        const metadata = Reflect.getMetadata('assembler:definition', MetadataService);
        if (!metadata || !metadata.tags || metadata.tags.length !== 2) {
          throw new Error('Metadata access failed');
        }
      }
    });

    bench('Runtime type information', () => {
      @Assemblage()
      class TypeInfoService implements AbstractAssemblage {
        getTypeInfo() {
          return {
            name: this.constructor.name,
            prototype: Object.getPrototypeOf(this),
            instanceof: this instanceof TypeInfoService,
          };
        }
      }

      // Measure runtime type information access
      for (let i = 0; i < 5000; i++) {
        const app = Assembler.build(TypeInfoService);
        const info = app.getTypeInfo();

        if (info.name !== 'TypeInfoService' || !info.instanceof) {
          throw new Error('Type information failed');
        }
      }
    });
  });

  describe('Integration and Complex Scenarios', () => {
    bench('Full-featured application', () => {
      // Database layer
      @Assemblage({ tags: ['database', 'persistence'] })
      class Database implements AbstractAssemblage {
        async connect() { return 'connected'; }
        async query(sql: string) { return `result:${sql}`; }
      }

      // Cache layer
      @Assemblage({ tags: ['cache', 'performance'] })
      class Cache implements AbstractAssemblage {
        private data: Map<string, any> = new Map();
        
        get(key: string) { return this.data.get(key) ?? `cached:${key}`; }
        set(key: string, value: any) { 
          this.data.set(key, value);
          return true; 
        }
      }

      // Business service
      @Assemblage({
        inject: [[Database], [Cache]],
        tags: ['service', 'business'],
      })
      class UserService implements AbstractAssemblage {
        constructor(private db: Database, private cache: Cache) {}

        async getUser(id: string) {
          const cached = this.cache.get(`user:${id}`);
          if (cached !== `cached:user:${id}`) {
            return await this.db.query(`SELECT * FROM users WHERE id = ${id}`);
          }
          return cached;
        }
      }

      // Event system
      @Assemblage({
        events: ['user:created', 'user:updated'],
        tags: ['events', 'pubsub'],
      })
      class EventBus implements AbstractAssemblage {
        emit(event: string, data: any) { return { event, data }; }
      }

      // Main application
      @Assemblage({
        inject: [[UserService], [EventBus], [Cache]],
        tags: ['app', 'main'],
      })
      class FullApp implements AbstractAssemblage {
        constructor(
          @Context() private context: any,
          private userService: UserService,
          private eventBus: EventBus,
          private cache: Cache
        ) {}

        testFullIntegration() {
          // Test service calls (synchronous - using sync cache check)
          const cached = this.cache.get(`user:123`);
          const user = cached !== `cached:user:123` ? 'from_db' : cached;

          // Test cache set operation
          const setResult = this.cache.set('test:key', 'test:value');

          // Test event emission
          const event = this.eventBus.emit('user:created', { id: '123' });

          // Test tag discovery
          const services = this.context.tagged('service');
          const databases = this.context.tagged('database');

          return {
            userResult: typeof user === 'string',
            cacheSet: setResult === true,
            eventEmitted: event.event === 'user:created',
            servicesFound: services.length >= 1,
            databasesFound: databases.length >= 1,
          };
        }
      }

      // Measure full integration performance
      for (let i = 0; i < 50; i++) {
        const app = Assembler.build(FullApp);
        const result = app.testFullIntegration();

        if (!result.userResult || !result.cacheSet || !result.eventEmitted || !result.servicesFound || !result.databasesFound) {
          throw new Error('Full integration failed');
        }
      }
    });
  });
});