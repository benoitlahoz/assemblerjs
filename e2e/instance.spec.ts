import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import {
  AbstractAssemblage,
  Assemblage,
  Assembler,
  Context,
  Use,
} from '../src';

describe('Instance injection with class or token identifiers.', () => {
  it('should inject an instance as dependency.', () => {
    @Assemblage()
    class DoNothing {
      public do() {
        return 'nothing';
      }
    }

    const instance = new DoNothing();

    @Assemblage({
      use: [
        [DoNothing, instance],
        ['config', { foo: 'bar' }],
        ['options', { baz: 'ack' }],
      ],
    })
    class App implements AbstractAssemblage {
      constructor(
        public doNothing: DoNothing,

        @Use('config') public config,
        @Use('options') private options,

        @Context() public context: any
      ) {
        expect(config.foo).toBe('bar');
      }
    }

    const app: App = Assembler.build(App);
    expect(app.doNothing.do()).toBe('nothing');
    expect(app.context.require('options').baz).toBe('ack');
  });
});
