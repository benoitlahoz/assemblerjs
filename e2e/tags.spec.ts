import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import {
  AbstractAssemblage,
  Assemblage,
  Assembler,
  AssemblerContext,
  Context,
} from '../src';

import { BypassLogger } from './fixtures/logger/logger-bypass.service';

import { AbstractErrorHandler } from './fixtures/error-handler/error-handler.abstract';
import { ErrorLogInjector } from './fixtures/error-handler/error-log-injector.service';
import { NoOpAssemblage } from '../src/core/assemblage.decorator';

describe('Tagged', () => {
  it('should get dependencies by tag string.', () => {
    @Assemblage({
      // NB: `ErrorLogInjector` injects `BypassLogger` and they are both tagged as 'tags_test'.

      inject: [[AbstractErrorHandler, ErrorLogInjector]],
    })
    class App implements AbstractAssemblage {
      constructor(@Context() public context: AssemblerContext) {}
    }

    const app: App = Assembler.build(App);

    // 'require' tagged instances.

    const tagged: unknown[] = app.context.tagged('tags_test');

    expect(tagged.length).toBe(2);
    expect(tagged[0]).toBeInstanceOf(BypassLogger);
    expect(tagged[1]).toBeInstanceOf(ErrorLogInjector);
  });
});
