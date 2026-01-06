import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import {
  AbstractAssemblage,
  Assemblage,
  Assembler,
  Configuration,
  Context,
  Definition,
  Optional,
  Use,
} from '../src';

import { Logger } from './fixtures/optional/logger.service';
import { Cache } from './fixtures/optional/cache.service';
import { Database } from './fixtures/optional/database.service';

describe('Optional Decorator', () => {
  describe('Without default value', () => {
    it('should inject undefined when dependency is not available', () => {
      @Assemblage()
      class ServiceWithOptional implements AbstractAssemblage {
        constructor(
          @Optional() public logger?: Logger
        ) {}
      }

      const service = Assembler.build(ServiceWithOptional);

      expect(service).toBeInstanceOf(ServiceWithOptional);
      expect(service.logger).toBeUndefined();
    });

    it('should inject the dependency when available', () => {
      @Assemblage({
        inject: [[Logger]],
      })
      class ServiceWithOptional implements AbstractAssemblage {
        constructor(
          @Optional() public logger?: Logger
        ) {}
      }

      const service = Assembler.build(ServiceWithOptional);

      expect(service).toBeInstanceOf(ServiceWithOptional);
      expect(service.logger).toBeInstanceOf(Logger);
      expect(service.logger?.log('test')).toBe('LOG: test');
    });

    it('should work with multiple optional dependencies', () => {
      @Assemblage()
      class ServiceWithMultipleOptionals implements AbstractAssemblage {
        constructor(
          @Optional() public logger?: Logger,
          @Optional() public cache?: Cache,
          @Optional() public database?: Database
        ) {}
      }

      const service = Assembler.build(ServiceWithMultipleOptionals);

      expect(service).toBeInstanceOf(ServiceWithMultipleOptionals);
      expect(service.logger).toBeUndefined();
      expect(service.cache).toBeUndefined();
      expect(service.database).toBeUndefined();
    });

    it('should work with mix of required and optional dependencies', () => {
      @Assemblage({
        inject: [[Database]],
      })
      class ServiceWithMixedDeps implements AbstractAssemblage {
        constructor(
          public database: Database,
          @Optional() public logger?: Logger
        ) {}
      }

      const service = Assembler.build(ServiceWithMixedDeps);

      expect(service).toBeInstanceOf(ServiceWithMixedDeps);
      expect(service.database).toBeInstanceOf(Database);
      expect(service.database.query('SELECT * FROM users')).toBe('Query: SELECT * FROM users');
      expect(service.logger).toBeUndefined();
    });
  });

  describe('With default value', () => {
    it('should inject default value when dependency is not available', () => {
      const defaultLogger = new Logger();

      @Assemblage()
      class ServiceWithDefaultOptional implements AbstractAssemblage {
        constructor(
          @Optional(defaultLogger) public logger: Logger
        ) {}
      }

      const service = Assembler.build(ServiceWithDefaultOptional);

      expect(service).toBeInstanceOf(ServiceWithDefaultOptional);
      expect(service.logger).toBe(defaultLogger);
      expect(service.logger.log('test')).toBe('LOG: test');
    });

    it('should inject the real dependency over default when available', () => {
      const defaultLogger = new Logger();

      @Assemblage({
        inject: [[Logger]],
      })
      class ServiceWithDefaultOptional implements AbstractAssemblage {
        constructor(
          @Optional(defaultLogger) public logger: Logger
        ) {}
      }

      const service = Assembler.build(ServiceWithDefaultOptional);

      // Should get the injected Logger, not the default
      expect(service).toBeInstanceOf(ServiceWithDefaultOptional);
      expect(service.logger).toBeInstanceOf(Logger);
      expect(service.logger).not.toBe(defaultLogger);
    });

    it('should allow null as default value', () => {
      @Assemblage()
      class ServiceWithNullDefault implements AbstractAssemblage {
        constructor(
          @Optional(null) public cache: Cache | null
        ) {}
      }

      const service = Assembler.build(ServiceWithNullDefault);

      expect(service).toBeInstanceOf(ServiceWithNullDefault);
      expect(service.cache).toBeNull();
    });

    it('should allow primitive values as default', () => {
      @Assemblage()
      class ServiceWithPrimitiveDefaults implements AbstractAssemblage {
        constructor(
          @Optional('fallback') public value: string,
          @Optional(42) public count: number,
          @Optional(false) public flag: boolean
        ) {}
      }

      const service = Assembler.build(ServiceWithPrimitiveDefaults);

      expect(service).toBeInstanceOf(ServiceWithPrimitiveDefaults);
      expect(service.value).toBe('fallback');
      expect(service.count).toBe(42);
      expect(service.flag).toBe(false);
    });

    it('should allow object literals as default', () => {
      interface Config {
        timeout: number;
        retries: number;
      }

      const defaultConfig: Config = { timeout: 3000, retries: 3 };

      @Assemblage()
      class ServiceWithObjectDefault implements AbstractAssemblage {
        constructor(
          @Optional(defaultConfig) public config: Config
        ) {}
      }

      const service = Assembler.build(ServiceWithObjectDefault);

      expect(service).toBeInstanceOf(ServiceWithObjectDefault);
      expect(service.config).toBe(defaultConfig);
      expect(service.config.timeout).toBe(3000);
      expect(service.config.retries).toBe(3);
    });
  });

  describe('With use instances', () => {
    it('should work with use instances and optional dependencies', () => {
      const customCache = new Cache();
      customCache.set('key', 'value');

      @Assemblage({
        use: [['customCache', customCache]],
      })
      class ServiceWithUseAndOptional implements AbstractAssemblage {
        constructor(
          @Optional() public logger?: Logger,
          @Optional() public database?: Database
        ) {}
      }

      const service = Assembler.build(ServiceWithUseAndOptional);

      expect(service).toBeInstanceOf(ServiceWithUseAndOptional);
      expect(service.logger).toBeUndefined();
      expect(service.database).toBeUndefined();
    });
  });

  describe('Error handling', () => {
    it('should throw when multiple decorators are used on the same parameter', () => {
      // This should throw during class decoration, not during build
      expect(() => {
        @Assemblage()
        class InvalidService implements AbstractAssemblage {
          constructor(
            @Optional() @Context() public logger: Logger
          ) {}
        }
        
        // Force evaluation
        InvalidService;
      }).toThrow(/Multiple decorators per parameter are not allowed/);
    });
  });

  describe('Edge cases', () => {
    it('should work with undefined as explicit default value', () => {
      @Assemblage()
      class ServiceWithExplicitUndefined implements AbstractAssemblage {
        constructor(
          @Optional(undefined) public logger: Logger | undefined
        ) {}
      }

      const service = Assembler.build(ServiceWithExplicitUndefined);

      expect(service).toBeInstanceOf(ServiceWithExplicitUndefined);
      expect(service.logger).toBeUndefined();
    });

    it('should handle optional with inject array', () => {
      @Assemblage({
        inject: [[Logger], [Cache]],
      })
      class ServiceWithInjectAndOptional implements AbstractAssemblage {
        constructor(
          public logger: Logger,
          public cache: Cache,
          @Optional() public database?: Database
        ) {}
      }

      const service = Assembler.build(ServiceWithInjectAndOptional);

      expect(service).toBeInstanceOf(ServiceWithInjectAndOptional);
      expect(service.logger).toBeInstanceOf(Logger);
      expect(service.cache).toBeInstanceOf(Cache);
      expect(service.database).toBeUndefined();
    });
  });

  describe('Mixed decorators in constructor', () => {
    it('should work with @Optional and @Context in same constructor', () => {
      @Assemblage()
      class ServiceWithContextAndOptional implements AbstractAssemblage {
        constructor(
          @Context() public context: any,
          @Optional() public logger?: Logger
        ) {}
      }

      const service = Assembler.build(ServiceWithContextAndOptional);

      expect(service).toBeInstanceOf(ServiceWithContextAndOptional);
      expect(service.context).toBeDefined();
      expect(service.context.require).toBeTypeOf('function');
      expect(service.logger).toBeUndefined();
    });

    it('should work with @Optional, @Use and required dependencies', () => {
      const config = { apiUrl: 'http://localhost:3000' };

      @Assemblage({
        use: [['config', config]],
        inject: [[Database]],
      })
      class ServiceWithMixedDecorators implements AbstractAssemblage {
        constructor(
          public database: Database,
          @Use('config') public config: any,
          @Optional() public logger?: Logger,
          @Optional() public cache?: Cache
        ) {}
      }

      const service = Assembler.build(ServiceWithMixedDecorators);

      expect(service).toBeInstanceOf(ServiceWithMixedDecorators);
      expect(service.database).toBeInstanceOf(Database);
      expect(service.config).toBe(config);
      expect(service.config.apiUrl).toBe('http://localhost:3000');
      expect(service.logger).toBeUndefined();
      expect(service.cache).toBeUndefined();
    });

    it('should work with @Optional and @Configuration', () => {
      @Assemblage({
        inject: [[Database]],
      })
      class ServiceWithConfigAndOptional implements AbstractAssemblage {
        constructor(
          public database: Database,
          @Configuration() public config: any,
          @Optional() public logger?: Logger
        ) {}
      }

      const service = Assembler.build(ServiceWithConfigAndOptional, { 
        timeout: 5000,
        retries: 3 
      });

      expect(service).toBeInstanceOf(ServiceWithConfigAndOptional);
      expect(service.database).toBeInstanceOf(Database);
      expect(service.config).toStrictEqual({ timeout: 5000, retries: 3 });
      expect(service.logger).toBeUndefined();
    });

    it('should work with @Optional and @Definition', () => {
      @Assemblage({
        tags: 'my-service',
        inject: [[Database]],
      })
      class ServiceWithDefinitionAndOptional implements AbstractAssemblage {
        constructor(
          @Definition() public definition: any,
          public database: Database,
          @Optional() public logger?: Logger,
          @Optional() public cache?: Cache
        ) {}
      }

      const service = Assembler.build(ServiceWithDefinitionAndOptional);

      expect(service).toBeInstanceOf(ServiceWithDefinitionAndOptional);
      expect(service.definition.tags).toStrictEqual(['my-service']);
      expect(service.definition.inject).toBeDefined();
      expect(service.database).toBeInstanceOf(Database);
      expect(service.logger).toBeUndefined();
      expect(service.cache).toBeUndefined();
    });

    it('should work with all decorators types mixed', () => {
      const config = { mode: 'production' };
      const defaultLogger = new Logger();

      @Assemblage({
        use: [['config', config]],
        inject: [[Database]],
      })
      class ComplexService implements AbstractAssemblage {
        constructor(
          @Context() public context: any,
          public database: Database,
          @Use('config') public config: any,
          @Configuration() public runtimeConfig: any,
          @Definition() public definition: any,
          @Optional(defaultLogger) public logger: Logger,
          @Optional() public cache?: Cache
        ) {}
      }

      const service = Assembler.build(ComplexService, { env: 'test' });

      expect(service).toBeInstanceOf(ComplexService);
      expect(service.context).toBeDefined();
      expect(service.context.require).toBeTypeOf('function');
      expect(service.database).toBeInstanceOf(Database);
      expect(service.config).toBe(config);
      expect(service.config.mode).toBe('production');
      expect(service.runtimeConfig.env).toBe('test');
      expect(service.definition).toBeDefined();
      expect(service.logger).toBe(defaultLogger);
      expect(service.cache).toBeUndefined();
    });

    it('should prioritize injected dependencies over optional defaults', () => {
      const defaultLogger = new Logger();

      @Assemblage({
        inject: [[Logger], [Database]],
      })
      class ServiceWithInjectedAndOptional implements AbstractAssemblage {
        constructor(
          public database: Database,
          @Optional(defaultLogger) public logger: Logger,
          @Optional() public cache?: Cache
        ) {}
      }

      const service = Assembler.build(ServiceWithInjectedAndOptional);

      expect(service).toBeInstanceOf(ServiceWithInjectedAndOptional);
      expect(service.database).toBeInstanceOf(Database);
      expect(service.logger).toBeInstanceOf(Logger);
      expect(service.logger).not.toBe(defaultLogger); // Should be injected instance
      expect(service.cache).toBeUndefined();
    });

    it('should handle multiple @Optional with different defaults', () => {
      const defaultLogger = new Logger();
      const defaultConfig = { timeout: 1000 };

      @Assemblage({
        inject: [[Database]],
      })
      class ServiceWithMultipleOptionalDefaults implements AbstractAssemblage {
        constructor(
          public database: Database,
          @Optional(defaultLogger) public logger: Logger,
          @Optional(defaultConfig) public config: any,
          @Optional(null) public cache: Cache | null,
          @Optional() public metrics?: any
        ) {}
      }

      const service = Assembler.build(ServiceWithMultipleOptionalDefaults);

      expect(service).toBeInstanceOf(ServiceWithMultipleOptionalDefaults);
      expect(service.database).toBeInstanceOf(Database);
      expect(service.logger).toBe(defaultLogger);
      expect(service.config).toBe(defaultConfig);
      expect(service.cache).toBeNull();
      expect(service.metrics).toBeUndefined();
    });
  });
});
