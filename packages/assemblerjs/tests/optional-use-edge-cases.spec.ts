import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import {
  AbstractAssemblage,
  Assemblage,
  Assembler,
  Optional,
  Use,
} from '../src';

/**
 * Edge cases tests for @Optional and @Use decorators to improve branch coverage
 */
describe('Optional and Use Decorators - Edge Cases', () => {
  describe('@Optional with default values', () => {
    it('should use default value when dependency not provided', () => {
      @Assemblage()
      class Service {
        getName() { return 'default service'; }
      }

      @Assemblage()
      class OptionalService implements AbstractAssemblage {
        constructor(
          @Optional(new Service()) public service: Service
        ) {}
      }

      const instance = Assembler.build(OptionalService);
      
      expect(instance.service).toBeInstanceOf(Service);
      expect(instance.service.getName()).toBe('default service');
    });

    it('should use default primitive value', () => {
      @Assemblage()
      class ServiceWithDefaults implements AbstractAssemblage {
        constructor(
          @Optional('default-string') public str: string,
          @Optional(42) public num: number,
          @Optional(true) public bool: boolean,
          @Optional({ key: 'value' }) public obj: any
        ) {}
      }

      const instance = Assembler.build(ServiceWithDefaults);
      
      expect(instance.str).toBe('default-string');
      expect(instance.num).toBe(42);
      expect(instance.bool).toBe(true);
      expect(instance.obj).toEqual({ key: 'value' });
    });

    it('should use default null value', () => {
      @Assemblage()
      class ServiceWithNull implements AbstractAssemblage {
        constructor(
          @Optional(null) public value: any
        ) {}
      }

      const instance = Assembler.build(ServiceWithNull);
      
      expect(instance.value).toBeNull();
    });
  });

  describe('@Use with different identifier types', () => {
    it('should work with string identifiers', () => {
      @Assemblage()
      class Logger {
        log(msg: string) { return `Logger: ${msg}`; }
      }

      @Assemblage({
        use: [['myLogger', new Logger()]]
      })
      class ServiceWithStringUse implements AbstractAssemblage {
        constructor(@Use('myLogger') public logger: Logger) {}
      }

      const instance = Assembler.build(ServiceWithStringUse);
      
      expect(instance.logger.log('test')).toBe('Logger: test');
    });

    it('should work with symbol identifiers', () => {
      const LOGGER_SYMBOL = Symbol('logger');

      @Assemblage()
      class Logger {
        log(msg: string) { return `Symbol Logger: ${msg}`; }
      }

      @Assemblage({
        use: [[LOGGER_SYMBOL, new Logger()]]
      })
      class ServiceWithSymbolUse implements AbstractAssemblage {
        constructor(@Use(LOGGER_SYMBOL) public logger: Logger) {}
      }

      const instance = Assembler.build(ServiceWithSymbolUse);
      
      expect(instance.logger.log('test')).toBe('Symbol Logger: test');
    });

    it('should work with class identifiers', () => {
      @Assemblage()
      class Logger {
        log(msg: string) { return `Class Logger: ${msg}`; }
      }

      @Assemblage({
        inject: [[Logger]]
      })
      class ServiceWithClassUse implements AbstractAssemblage {
        constructor(@Use(Logger) public logger: Logger) {}
      }

      const instance = Assembler.build(ServiceWithClassUse);
      
      expect(instance.logger).toBeInstanceOf(Logger);
      expect(instance.logger.log('test')).toBe('Class Logger: test');
    });
  });

  describe('Edge cases with undefined/null', () => {
    it('should handle undefined in @Optional', () => {
      @Assemblage()
      class ServiceWithUndefined implements AbstractAssemblage {
        constructor(
          @Optional(undefined) public value: any
        ) {}
      }

      const instance = Assembler.build(ServiceWithUndefined);
      
      expect(instance.value).toBeUndefined();
    });

    it('should handle multiple @Optional parameters', () => {
      @Assemblage()
      class MultiOptionalService implements AbstractAssemblage {
        constructor(
          @Optional('first') public first: string,
          @Optional('second') public second: string,
          @Optional('third') public third: string
        ) {}
      }

      const instance = Assembler.build(MultiOptionalService);
      
      expect(instance.first).toBe('first');
      expect(instance.second).toBe('second');
      expect(instance.third).toBe('third');
    });
  });
});
