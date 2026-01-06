import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import {
  AbstractAssemblage,
  Assemblage,
  Assembler,
  Optional,
} from '../src';

/**
 * Type safety tests for @Optional decorator
 * These tests verify that TypeScript compilation works correctly
 */
describe('@Optional Type Safety', () => {
  it('should compile without parameter (undefined default)', () => {
    @Assemblage()
    class Logger {
      log(msg: string) { return `Log: ${msg}`; }
    }

    @Assemblage()
    class ServiceWithOptionalNoDefault implements AbstractAssemblage {
      constructor(
        @Optional() public logger?: Logger  // ✅ Should compile - no parameter
      ) {}
    }

    const service = Assembler.build(ServiceWithOptionalNoDefault);
    expect(service).toBeDefined();
  });

  it('should compile with default value parameter', () => {
    class DefaultLogger {
      log(msg: string) { return `Default: ${msg}`; }
    }

    @Assemblage()
    class ServiceWithOptionalDefault implements AbstractAssemblage {
      constructor(
        @Optional(new DefaultLogger()) public logger: DefaultLogger  // ✅ Should compile - with parameter
      ) {}
    }

    const service = Assembler.build(ServiceWithOptionalDefault);
    expect(service.logger).toBeInstanceOf(DefaultLogger);
    expect(service.logger.log('test')).toBe('Default: test');
  });

  it('should compile with primitive default values', () => {
    @Assemblage()
    class ServiceWithPrimitives implements AbstractAssemblage {
      constructor(
        @Optional('hello') public str: string,           // ✅ string default
        @Optional(42) public num: number,                // ✅ number default
        @Optional(true) public bool: boolean,            // ✅ boolean default
        @Optional(null) public nullable: string | null,  // ✅ null default
        @Optional(undefined) public undef?: any          // ✅ explicit undefined
      ) {}
    }

    const service = Assembler.build(ServiceWithPrimitives);
    expect(service.str).toBe('hello');
    expect(service.num).toBe(42);
    expect(service.bool).toBe(true);
    expect(service.nullable).toBeNull();
    expect(service.undef).toBeUndefined();
  });

  it('should compile with object default values', () => {
    interface Config {
      timeout: number;
      retries: number;
    }

    const defaultConfig: Config = { timeout: 5000, retries: 3 };

    @Assemblage()
    class ServiceWithObjectDefault implements AbstractAssemblage {
      constructor(
        @Optional(defaultConfig) public config: Config,                    // ✅ object default
        @Optional({ key: 'value' }) public settings: { key: string },     // ✅ inline object
        @Optional([1, 2, 3]) public numbers: number[]                     // ✅ array default
      ) {}
    }

    const service = Assembler.build(ServiceWithObjectDefault);
    expect(service.config).toBe(defaultConfig);
    expect(service.settings).toEqual({ key: 'value' });
    expect(service.numbers).toEqual([1, 2, 3]);
  });
});
