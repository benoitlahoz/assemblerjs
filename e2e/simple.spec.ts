import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { AbstractAssemblage, Assemblage, Assembler } from '../src';

import { AbstractLogger } from './fixtures/logger/logger.abstract';
import { BypassLogger } from './fixtures/logger/logger-bypass.service';

describe('Simple', () => {
  it('should bootstrap an assemblage as entry point.', () => {
    const app: BypassLogger = Assembler.build(BypassLogger);

    // `BypassLogger` returns the array of arguments passed to its methods.
    expect(app.log('foo')).toStrictEqual(['foo']);
    expect(app.log('foo', 'bar')).toStrictEqual(['foo', 'bar']);
  });

  it('should inject a dependency identified only by its concrete class.', () => {
    @Assemblage({
      inject: [[BypassLogger]],
    })
    class App implements AbstractAssemblage {
      constructor(public logger: BypassLogger) {}
    }

    const app: App = Assembler.build(App);
    expect(app.logger.log('foo')).toStrictEqual(['foo']);
  });

  it('should inject a dependency that bounds a concrete class to an abstract class.', () => {
    const LoggerConfiguration = {
      foo: 'bar',
    };

    @Assemblage({
      inject: [[AbstractLogger, BypassLogger, LoggerConfiguration]],
    })
    class App implements AbstractAssemblage {
      constructor(public logger: AbstractLogger) {}
    }

    // Bootstrap application from entry assemblage.
    const app: App = Assembler.build(App);
    expect(app.logger.log('foo')).toStrictEqual(['foo']);
  });
});
