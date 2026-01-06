import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import {
  AbstractAssemblage,
  Assemblage,
  Assembler,
  Context,
  Use,
  Configuration,
  Definition,
  Dispose,
  Global
} from '../src';

describe('Parameter Decorators - Advanced Usage', () => {
  describe('@Use decorator', () => {
    it('should inject specific implementation', () => {
      abstract class AbstractLogger {
        abstract log(message: string): string;
      }

      @Assemblage()
      class FileLogger extends AbstractLogger {
        log(message: string): string {
          return `File: ${message}`;
        }
      }

      @Assemblage({
        inject: [[AbstractLogger, FileLogger]],
      })
      class ServiceWithSpecificLogger implements AbstractAssemblage {
        constructor(
           public logger: AbstractLogger
        ) {}
      }

      const service = Assembler.build(ServiceWithSpecificLogger);

      expect(service.logger).toBeInstanceOf(FileLogger);
      expect(service.logger.log('test')).toBe('File: test');
    });

    it('should work with multiple @Use decorators', () => {
      class ServiceA {
        getName() { return 'A'; }
      }

      class ServiceB {
        getName() { return 'B'; }
      }

      class ServiceC {
        getName() { return 'C'; }
      }

      @Assemblage({
        use:[['serviceA', new ServiceA()], ['serviceB',  new ServiceB()], ['serviceC', new ServiceC()]]
      })
      class MultiUseService implements AbstractAssemblage {
        constructor(
          @Use('serviceA') public a: ServiceA,
          @Use('serviceB') public b: ServiceB,
          @Use('serviceC') public c: ServiceC
        ) {}
        
        getCombined() {
          return `${this.a.getName()}-${this.b.getName()}-${this.c.getName()}`;
        }
      }

      const service = Assembler.build(MultiUseService);

      expect(service.getCombined()).toBe('A-B-C');
    });
  });

  describe('@Configuration decorator', () => {
    it('should inject configuration value', () => {
      @Assemblage()
      class ConfigurableService implements AbstractAssemblage {
        constructor(
          @Configuration() public config: any
        ) {}
        
        getTimeout() {
          return this.config.timeout;
        }
      }

      const service = Assembler.build(ConfigurableService, {
        timeout: 5000
      });

      expect(service.config.timeout).toBe(5000);
      expect(service.getTimeout()).toBe(5000);
    });

    it('should inject multiple configuration values', () => {
      @Assemblage()
      class MultiConfigService implements AbstractAssemblage {
        constructor(
          @Configuration() public config: any
        ) {}
        
        getConnectionString() {
          return `${this.config.host}:${this.config.port}`;
        }
      }

      const service = Assembler.build(MultiConfigService, {
        host: 'localhost',
        port: 3000,
        debug: true
      });

      expect(service.config.host).toBe('localhost');
      expect(service.config.port).toBe(3000);
      expect(service.config.debug).toBe(true);
      expect(service.getConnectionString()).toBe('localhost:3000');
    });

    it('should work with nested configuration', () => {
      @Assemblage()
      class NestedConfigService implements AbstractAssemblage {
        constructor(
          @Configuration() public config: any,
        ) {}
      }

      const service = Assembler.build(NestedConfigService, {
          database: {
            host: 'db.example.com',
            port: 5432
        }
      });

      expect(service.config.database.host).toBe('db.example.com');
      expect(service.config.database.port).toBe(5432);
    });
  });

  describe('@Definition decorator', () => {
    it('should inject service definition', () => {
      @Assemblage()
      class Logger {
        log(msg: string) {
          return `Log: ${msg}`;
        }
      }

      @Assemblage({
        inject: [[Logger]],
        metadata: { serviceName: 'myService', version: '1.0' }
      })
      class ServiceWithDefinition implements AbstractAssemblage {
        constructor(
          @Definition() public definition: any,
          public logger: Logger
        ) {}
      }

      const service = Assembler.build(ServiceWithDefinition);

      expect(service.definition).toBeDefined();
      expect(service.definition.metadata).toBeDefined();
      expect(service.definition.metadata.serviceName).toBe('myService');
      expect(service.definition.metadata.version).toBe('1.0');
      expect(service.definition.inject).toBeDefined();
    });
  });

  describe('@Dispose decorator', () => {
    it('should call dispose method on cleanup', () => {
      let disposed = false;

      @Assemblage()
      class DisposableResource {
        onDispose() {
          disposed = true;
        }
      }

      @Assemblage({
        inject: [[DisposableResource]],
      })
      class ServiceWithDispose implements AbstractAssemblage {
        constructor(
          public resource: DisposableResource,
          @Dispose() public dispose: () => void
        ) {}
      }

      const service = Assembler.build(ServiceWithDispose);
      
      expect(service.resource).toBeInstanceOf(DisposableResource);
      expect(disposed).toBe(false);
      
      service.dispose();
      expect(disposed).toBe(true);
    });
  });

  describe('Combined decorators', () => {
    it('should work with Context, Use, Configuration, and Global together', () => {
      const globalCache = { type: 'redis' };
      
      @Assemblage()
      class CacheService {
        getCacheType() {
          return 'memory';
        }
      }

      @Assemblage({
        inject: [[CacheService]],
        global: { config: globalCache }
      })
      class ComplexService implements AbstractAssemblage {
        constructor(
          public cache: CacheService,
          @Context() public ctx: any,
          @Configuration() public config: any,
          @Global('config') public globalConfig: any
        ) {}
        
        getAllValues() {
          return {
            hasContext: !!this.ctx,
            cacheType: this.cache.getCacheType(),
            timeout: this.config.timeout,
            globalCacheType: this.globalConfig.type
          };
        }
      }

      const service = Assembler.build(ComplexService, {
        timeout: 3000
      });

      const values = service.getAllValues();
      expect(values.hasContext).toBe(true);
      expect(values.cacheType).toBe('memory');
      expect(values.timeout).toBe(3000);
      expect(values.globalCacheType).toBe('redis');
    });
  });

  describe('Error cases', () => {
    it('should throw when @Use target is not registered', () => {
      @Assemblage()
      class UnregisteredService {}

      @Assemblage()
      class ServiceWithMissingDep implements AbstractAssemblage {
        constructor(
          @Use('unregisteredService') public dep: UnregisteredService
        ) {}
      }

      expect(() => {
        Assembler.build(ServiceWithMissingDep);
      }).toThrow();
    });
  });
});
