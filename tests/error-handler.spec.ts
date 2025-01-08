import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { AbstractAssemblage, Assemblage, Assembler } from '../src';

import { AbstractLogger } from './fixtures/logger/logger.abstract';
import { BypassLogger } from './fixtures/logger/logger-bypass.assemblage';

import { AbstractErrorHandler } from './fixtures/error-handler/error-handler.abstract';
import { ErrorLog } from './fixtures/error-handler/error-log-simple.assemblage';
import { ErrorLogInjector } from './fixtures/error-handler/error-log-injector.assemblage';

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

    // `BypassLogger` returns the array of arguments passed to its methods.
    expect(app.error.log(new Error('foo'))).toStrictEqual(['foo']);
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
        // Logger is required: injected by `ErrorLogInjector`, will throw if not.

        expect(this.logger).toBeDefined();
        expect(this.logger).toBeInstanceOf(BypassLogger);
      }
    }

    const app: App = Assembler.build(App);
    expect(app.error.log(new Error('foo'))).toStrictEqual(['foo']);
  });
});
