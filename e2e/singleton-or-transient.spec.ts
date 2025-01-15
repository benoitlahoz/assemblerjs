import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import type { AssemblerContext } from '../src';
import { AbstractAssemblage, Assemblage, Assembler } from '../src';

import { AbstractLogger } from './fixtures/logger/logger.abstract';
import { BypassLogger } from './fixtures/logger/logger-bypass.service';
import { TransientAssemblage } from './fixtures/transient/transient.service';

describe('Singleton or Transient', () => {
  it('should get a different instance when requiring a transient assemblage.', () => {
    @Assemblage({
      inject: [[AbstractLogger, BypassLogger], [TransientAssemblage]],
    })
    class App implements AbstractAssemblage {
      constructor(
        public logger: AbstractLogger,
        public transient: TransientAssemblage
      ) {}

      public onInit(context: AssemblerContext): void {
        const other = context.require(TransientAssemblage);
        expect(this.transient === other).toBeFalsy();
      }
    }

    // Bootstrap application from entry assemblage.
    const app: App = Assembler.build(App);
    expect(app.logger.log('foo')).toStrictEqual(['foo']);
  });
});
