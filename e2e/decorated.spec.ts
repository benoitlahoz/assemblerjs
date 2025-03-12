import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import {
  AbstractAssemblage,
  Assemblage,
  Assembler,
  AssemblerContext,
  Configuration,
  Context,
  Definition,
  Dispose,
  Use,
} from '../src';
import { createWrappedDecorator } from '../src';

describe('EventsSimple', () => {
  it('should create a custom decorator to stack on `Assemblage` one.', () => {
    // Warning: pass a 'function', NOT AN ARROW FUNCTION to access 'this'.
    const CustomDecorator = createWrappedDecorator(function () {
      expect(this).toBeInstanceOf(App);
      expect(this.context).toBeDefined();
      expect(this.definition).toBeDefined();
      expect(this.configuration).toBeDefined();
      expect(this.dispose).toBeDefined();
      expect(this.foo).toBeDefined();
      expect(this.bar).toBeDefined();
    });

    @CustomDecorator()
    @Assemblage({
      use: [
        ['foo', { foo: 'bar' }],
        ['bar', { bar: 'ack' }],
      ],
    })
    class App implements AbstractAssemblage {
      constructor(
        @Use('foo') public foo: any,
        @Context() public context: AssemblerContext,
        @Use('bar') public bar: any,
        @Definition() public definition: any,
        @Configuration() public configuration: any,
        @Dispose() public dispose: any
      ) {
        expect(this.context).toBeDefined();
        expect(this.definition).toBeDefined();
        expect(this.configuration).toBeDefined();
        expect(this.dispose).toBeDefined();
        expect(this.foo).toBeDefined();
        expect(this.bar).toBeDefined();

        expect(this.context.has).toBeTypeOf('function');
        expect(this.definition.use).toBeDefined();
        expect(this.configuration).toBeTypeOf('object');
        expect(this.dispose).toBeTypeOf('function');
        expect(this.foo.foo).toBe('bar');
        expect(this.bar.bar).toBe('ack');
      }
    }

    Assembler.build(App);
  });
});
