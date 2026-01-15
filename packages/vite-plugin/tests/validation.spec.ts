import { describe, it, expect } from 'vitest';
import { createValidationPlugin } from '../src/validation';
import type { AssemblerjsPluginOptions } from '../src/types';

describe('AssemblerJS Validation', () => {
  const defaultOptions: Required<AssemblerjsPluginOptions> = {
    swc: {
      enabled: true,
      target: 'es2021',
      keepClassNames: true,
    },
    reflectMetadata: {
      autoInject: true,
      injectMode: 'entry',
    },
    validation: {
      enabled: true,
      strictInjection: true,
      checkCircular: true,
      validateTags: true,
      warnUnusedAssemblages: false,
    },
  };

  describe('File Detection', () => {
    it('should detect files with @Assemblage decorator', () => {
      const plugin = createValidationPlugin(defaultOptions) as any;

      const code = `
        @Assemblage()
        class TestClass {}
      `;

      const result = plugin.transform?.(code, '/src/test.ts');
      expect(result).toBeUndefined();
    });

    it('should detect files with inject configuration', () => {
      const plugin = createValidationPlugin(defaultOptions) as any;

      const code = `
        @Assemblage({
          inject: [[Service]]
        })
        class TestClass {}
      `;

      const result = plugin.transform?.(code, '/src/test.ts');
      expect(result).toBeUndefined();
    });

    it('should detect files with tags configuration', () => {
      const plugin = createValidationPlugin(defaultOptions) as any;

      const code = `
        @Assemblage({
          tags: 'test'
        })
        class TestClass {}
      `;

      const result = plugin.transform?.(code, '/src/test.ts');
      expect(result).toBeUndefined();
    });

    it('should ignore non-AssemblerJS files', () => {
      const plugin = createValidationPlugin(defaultOptions) as any;

      const code = `
        class RegularClass {
          constructor() {}
        }
      `;

      const result = plugin.transform?.(code, '/src/regular.ts');
      expect(result).toBeUndefined();
    });
  });

  describe('Assemblage Analysis', () => {
    it('should parse simple @Assemblage decorator', () => {
      const plugin = createValidationPlugin(defaultOptions) as any;

      const code = `
        import { Assemblage } from '@assemblerjs/core';

        @Assemblage()
        class UserService implements AbstractAssemblage {
          constructor() {}
        }
      `;

      plugin.transform?.(code, '/src/user.service.ts');

      // Trigger buildEnd to check analysis
      expect(() => {
        (plugin.buildEnd as any)();
      }).not.toThrow();
    });

    it('should parse @Assemblage with inject configuration', () => {
      const plugin = createValidationPlugin(defaultOptions) as any;

      const code = `
        import { Assemblage } from '@assemblerjs/core';

        @Assemblage({
          inject: [[LoggerService]]
        })
        class UserService implements AbstractAssemblage {
          constructor(private logger: LoggerService) {}
        }
      `;

      plugin.transform?.(code, '/src/user.service.ts');

      expect(() => {
        (plugin.buildEnd as any)();
      }).not.toThrow();
    });

    it('should parse @Assemblage with abstraction injection', () => {
      const plugin = createValidationPlugin(defaultOptions) as any;

      const code = `
        import { Assemblage } from '@assemblerjs/core';

        @Assemblage({
          inject: [[AbstractLogger, BypassLogger, { level: 'info' }]]
        })
        class App implements AbstractAssemblage {
          constructor(private logger: AbstractLogger) {}
        }
      `;

      plugin.transform?.(code, '/src/app.ts');


      expect(() => {
        (plugin.buildEnd as any)();
      }).not.toThrow();
    });

    it('should parse @Assemblage with string tags', () => {
      const plugin = createValidationPlugin(defaultOptions) as any;

      const code = `
        import { Assemblage } from '@assemblerjs/core';

        @Assemblage({
          tags: 'logger'
        })
        class BypassLogger implements AbstractLogger {
          log(...args: any[]) { return args; }
        }
      `;

      plugin.transform?.(code, '/src/logger.service.ts');


      expect(() => {
        (plugin.buildEnd as any)();
      }).not.toThrow();
    });

    it('should parse @Assemblage with array tags', () => {
      const plugin = createValidationPlugin(defaultOptions) as any;

      const code = `
        import { Assemblage } from '@assemblerjs/core';

        @Assemblage({
          tags: ['logger', 'service']
        })
        class BypassLogger implements AbstractLogger {
          log(...args: any[]) { return args; }
        }
      `;

      plugin.transform?.(code, '/src/logger.service.ts');


      expect(() => {
        (plugin.buildEnd as any)();
      }).not.toThrow();
    });

    it('should parse multiple inject dependencies', () => {
      const plugin = createValidationPlugin(defaultOptions) as any;

      const code = `
        import { Assemblage } from '@assemblerjs/core';

        @Assemblage({
          inject: [
            [LoggerService],
            [DatabaseService],
            [AbstractCache, RedisCache]
          ]
        })
        class App implements AbstractAssemblage {
          constructor(
            private logger: LoggerService,
            private db: DatabaseService,
            private cache: AbstractCache
          ) {}
        }
      `;

      plugin.transform?.(code, '/src/app.ts');


      expect(() => {
        (plugin.buildEnd as any)();
      }).not.toThrow();
    });
  });

  describe('Dependency Validation', () => {
    it('should detect missing dependencies', () => {
      const plugin = createValidationPlugin(defaultOptions) as any;

      // First file with injection
      const code1 = `
        import { Assemblage } from '@assemblerjs/core';

        @Assemblage()
        class UserService implements AbstractAssemblage {
          constructor(private logger: LoggerService) {}
        }
      `;

      plugin.transform?.(code1, '/src/user.service.ts');

      // Trigger buildEnd - should error because LoggerService is not defined
      expect(() => {
        (plugin.buildEnd as any)();
      }).toThrow('AssemblerJS validation failed');
    });

    it('should validate existing dependencies', () => {
      const plugin = createValidationPlugin(defaultOptions) as any;

      // Logger service
      const code1 = `
        import { Assemblage } from '@assemblerjs/core';

        @Assemblage()
        class LoggerService implements AbstractAssemblage {
          log(message: string) { console.log(message); }
        }
      `;

      // User service that injects Logger
      const code2 = `
        import { Assemblage } from '@assemblerjs/core';

        @Assemblage({
          inject: [[LoggerService]]
        })
        class UserService implements AbstractAssemblage {
          constructor(private logger: LoggerService) {}
        }
      `;

      plugin.transform?.(code1, '/src/logger.service.ts');
      plugin.transform?.(code2, '/src/user.service.ts');


      // Should not throw any errors
      (plugin.buildEnd as any)();
    });

    it('should detect circular dependencies', () => {
      const plugin = createValidationPlugin(defaultOptions) as any;

      // Service A injects Service B
      const code1 = `
        import { Assemblage } from '@assemblerjs/core';

        @Assemblage({
          inject: [[ServiceB]]
        })
        class ServiceA implements AbstractAssemblage {
          constructor(private serviceB: ServiceB) {}
        }
      `;

      // Service B injects Service A (circular)
      const code2 = `
        import { Assemblage } from '@assemblerjs/core';

        @Assemblage({
          inject: [[ServiceA]]
        })
        class ServiceB implements AbstractAssemblage {
          constructor(private serviceA: ServiceA) {}
        }
      `;

      plugin.transform?.(code1, '/src/service-a.ts');
      plugin.transform?.(code2, '/src/service-b.ts');

      // Trigger buildEnd - should error because of circular dependency
      expect(() => {
        (plugin.buildEnd as any)();
      }).toThrow('AssemblerJS validation failed');
    });
  });

  describe('Configuration Validation', () => {
    it('should skip validation when disabled', () => {
      const options = { ...defaultOptions, validation: { ...defaultOptions.validation, enabled: false } };
      const plugin = createValidationPlugin(options);

      expect(plugin).toEqual({});
    });

    it('should skip strict injection when disabled', () => {
      const options = { ...defaultOptions, validation: { ...defaultOptions.validation, strictInjection: false } };
      const plugin = createValidationPlugin(options) as any;

      const code = `
        @Assemblage({
          inject: [[MissingService]]
        })
        class TestService implements AbstractAssemblage {
          constructor(private missing: MissingService) {}
        }
      `;

      plugin.transform?.(code, '/src/test.ts');


      // Should not throw errors when strict injection is disabled
      (plugin.buildEnd as any)();
    });

    it('should skip circular dependency check when disabled', () => {
      const options = { ...defaultOptions, validation: { ...defaultOptions.validation, checkCircular: false } };
      const plugin = createValidationPlugin(options) as any;

      // Create circular dependency
      const code1 = `
        @Assemblage({ inject: [[ServiceB]] })
        class ServiceA implements AbstractAssemblage {
          constructor(private serviceB: ServiceB) {}
        }
      `;

      const code2 = `
        @Assemblage({ inject: [[ServiceA]] })
        class ServiceB implements AbstractAssemblage {
          constructor(private serviceA: ServiceA) {}
        }
      `;

      plugin.transform?.(code1, '/src/service-a.ts');
      plugin.transform?.(code2, '/src/service-b.ts');


      // Should not throw errors when circular check is disabled
      (plugin.buildEnd as any)();
    });
  });
});