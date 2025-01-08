import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { AbstractAssemblage, Assemblage, Assembler } from '../src';
import { AbstractLogger } from './fixtures/abstractions/logger.abstract';
import { BypassLogger } from './fixtures/implementations/logger-bypass.assemblage';
import { ErrorLog } from './fixtures/implementations/error-log-simple.assemblage';
import { ErrorLogInjector } from './fixtures/implementations/error-log-injector.assemblage';
import { AbstractErrorHandler } from './fixtures/abstractions/error-handler.abstract';

describe('ErrorHandler', () => {
  it('should bootstrap an assemblage as entry point.', () => {
    const app: BypassLogger = Assembler.build(BypassLogger);
    expect(app.log('foo')).toStrictEqual(['foo']);
  });

  it('should inject dependencies from root assemblage.', () => {
    @Assemblage({
      inject: [[AbstractLogger, BypassLogger], [ErrorLog]],
    })
    class App implements AbstractAssemblage {
      constructor(public error: ErrorLog) {}
    }

    const app: App = Assembler.build(App);
    expect(app.error.throw(new Error('foo'))).toStrictEqual(['foo']);
  });

  it('should inject nested dependencies from injected assemblage.', () => {
    @Assemblage({
      inject: [[AbstractErrorHandler, ErrorLogInjector]],
    })
    class App implements AbstractAssemblage {
      constructor(
        public error: AbstractErrorHandler,
        public logger: AbstractLogger
      ) {
        // Logger is injected by error handler.
        expect(this.logger).toBeDefined();
        expect(this.logger).toBeInstanceOf(BypassLogger);
      }
    }

    const app: App = Assembler.build(App);
    expect(app.error.throw(new Error('foo'))).toStrictEqual(['foo']);
  });
});
