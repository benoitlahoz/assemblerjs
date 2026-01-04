import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import {
  AbstractAssemblage,
  Assemblage,
  Assembler,
  type AssemblerContext,
  Configuration,
  Context,
  Definition,
  Dispose,
  Use,
} from '../src';
import { createConstructorDecorator } from '../src';

describe('EventsSimple', () => {
  it('should create a custom decorator to stack on `Assemblage` one.', () => {
    // Warning: pass a 'function', NOT AN ARROW FUNCTION to access 'this'.
    const CustomDecorator = createConstructorDecorator(function (this: App,
      definition?: Record<string, any>
    ) {
      // Create a new property to get definition.
      (this as any).customDefinition = definition;

      expect(this).toBeInstanceOf(App);
      expect(this.context).toBeDefined();
      expect(this.definition).toBeDefined();
      expect(this.configuration).toBeDefined();
      expect(this.dispose).toBeDefined();
      expect(this.foo).toBeDefined();
      expect(this.bar).toBeDefined();
    });

    @CustomDecorator({
      prop: 'value',
    })
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

        // Not defined yet: `CustomDecorator` creates a subclass of `App`, i.e. it is not yet instantiated.
        expect((this as any)['customDefinition']).toBeUndefined();
      }

      public onInit(): void {
        // Definition is now defined.
        // Note that we would have to subclass AbstractAssemblage for it to be type-safe,
        // or to add this `customDefinition` property to our `App`.
        expect((this as any)['customDefinition']).toStrictEqual({
          prop: 'value',
        });
      }
    }

    Assembler.build(App);
  });
});
