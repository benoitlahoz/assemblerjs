import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import {
  AbstractAssemblage,
  Assemblage,
  Assembler,
  Global,
} from '../src';

describe('@Global Decorator', () => {
  it('should inject global value by string identifier', () => {
    const globalDb = { connection: 'test-db', version: '1.0' };

    @Assemblage({
      global: { database: globalDb }
    })
    class DatabaseService implements AbstractAssemblage {
      constructor(@Global('database') public db: any) {}
      
      getConnection() {
        return this.db.connection;
      }
    }

    const service = Assembler.build(DatabaseService);

    expect(service).toBeInstanceOf(DatabaseService);
    expect(service.db).toBe(globalDb);
    expect(service.getConnection()).toBe('test-db');
  });

  it('should inject multiple global values', () => {
    const globalDb = { connection: 'test-db' };
    const globalCache = { type: 'redis', ttl: 3600 };

    @Assemblage({
      global: { 
        database: globalDb,
        cache: globalCache 
      }
    })
    class MultiGlobalService implements AbstractAssemblage {
      constructor(
        @Global('database') public db: any,
        @Global('cache') public cache: any
      ) {}
    }

    const service = Assembler.build(MultiGlobalService);

    expect(service.db).toBe(globalDb);
    expect(service.cache).toBe(globalCache);
    expect(service.cache.ttl).toBe(3600);
  });

  it('should work with mixed dependencies and globals', () => {
    const globalConfig = { apiKey: 'secret-key', timeout: 5000 };

    @Assemblage()
    class ConfigProvider {
      getValue(key: string) {
        return `provider-${key}`;
      }
    }

    @Assemblage({
      inject: [[ConfigProvider]],
      global: { config: globalConfig }
    })
    class MixedService implements AbstractAssemblage {
      constructor(
        public provider: ConfigProvider,
        @Global('config') public config: any
      ) {}
      
      getApiKey() {
        return this.config.apiKey;
      }
    }

    const service = Assembler.build(MixedService);

    expect(service.provider).toBeInstanceOf(ConfigProvider);
    expect(service.provider.getValue('test')).toBe('provider-test');
    expect(service.config).toBe(globalConfig);
    expect(service.getApiKey()).toBe('secret-key');
  });

  it('should work in nested assemblages', () => {
    const globalLogger = { 
      level: 'debug',
      log: (msg: string) => `[LOG] ${msg}`
    };

    @Assemblage()
    class InnerService {
      constructor(@Global('logger') public logger: any) {}
    }

    @Assemblage({
      inject: [[InnerService]],
      global: { logger: globalLogger }
    })
    class OuterService implements AbstractAssemblage {
      constructor(
        public inner: InnerService,
        @Global('logger') public logger: any
      ) {}
    }

    const service = Assembler.build(OuterService);

    expect(service.logger).toBe(globalLogger);
    expect(service.inner.logger).toBe(globalLogger);
    expect(service.logger.log('test')).toBe('[LOG] test');
  });

  it('should handle complex global objects', () => {
    const complexGlobal = {
      host: 'localhost',
      port: 5432,
      credentials: {
        user: 'admin',
        password: 'secret'
      }
    };

    @Assemblage({
      global: { database: complexGlobal }
    })
    class ComplexService implements AbstractAssemblage {
      constructor(@Global('database') public dbConfig: any) {}
      
      getDatabaseHost() {
        return this.dbConfig.host;
      }
    }

    const service = Assembler.build(ComplexService);

    expect(service.getDatabaseHost()).toBe('localhost');
    expect(service.dbConfig.port).toBe(5432);
  });

  it('should register globals before resolving injected dependencies', () => {
    const globalConfig = { flag: true };

    @Assemblage()
    class NeedsGlobal implements AbstractAssemblage {
      constructor(@Global('config') public config: any) {}
    }

    @Assemblage({
      inject: [[NeedsGlobal]],
      global: { config: globalConfig },
    })
    class RootWithGlobals implements AbstractAssemblage {
      constructor(public dep: NeedsGlobal) {}
    }

    const app = Assembler.build(RootWithGlobals);

    expect(app.dep.config).toBe(globalConfig);
  });
});
