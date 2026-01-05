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

// Type-safe definition interface
interface CustomDecoratorConfig {
  prop: string;
}

// Type-safe class with custom property
interface AppWithCustom {
  customDefinition?: CustomDecoratorConfig;
}

describe('Custom Constructor Decorator', () => {
  it('should create a custom decorator to stack above @Assemblage decorator.', () => {
    // Warning: pass a 'function', NOT AN ARROW FUNCTION to access 'this'.
    const CustomDecorator = createConstructorDecorator<App & AppWithCustom, CustomDecoratorConfig>(
      function (definition) {
        // Create a new property to get definition.
        // Type-safe: `this` is typed as App & AppWithCustom
        this.customDefinition = definition;

        expect(this).toBeInstanceOf(App);
        expect(this.context).toBeDefined();
        expect(this.definition).toBeDefined();
        expect(this.configuration).toBeDefined();
        expect(this.dispose).toBeDefined();
        expect(this.foo).toBeDefined();
        expect(this.bar).toBeDefined();
      }
    );

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
      // Merge with custom interface for type-safety
      customDefinition?: CustomDecoratorConfig;

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
        expect(this.customDefinition).toBeUndefined();
      }

      public onInit(): void {
        // Definition is now defined - type-safe access
        expect(this.customDefinition).toStrictEqual({
          prop: 'value',
        });
        expect(this.customDefinition?.prop).toBe('value');
      }
    }

    Assembler.build(App);
  });

  it('should create a custom decorator to stack below @Assemblage decorator.', () => {
    // Warning: pass a 'function', NOT AN ARROW FUNCTION to access 'this'.
    const CustomDecorator = createConstructorDecorator<App2 & AppWithCustom, CustomDecoratorConfig>(
      function (definition) {
        // Create a new property to get definition.
        // Type-safe: `this` is typed as App2 & AppWithCustom
        this.customDefinition = definition;

        expect(this).toBeInstanceOf(App2);
        expect(this.context).toBeDefined();
        expect(this.definition).toBeDefined();
        expect(this.configuration).toBeDefined();
        expect(this.dispose).toBeDefined();
        expect(this.foo).toBeDefined();
        expect(this.bar).toBeDefined();
      }
    );

    @Assemblage({
      use: [
        ['foo', { foo: 'bar' }],
        ['bar', { bar: 'ack' }],
      ],
    })
    @CustomDecorator({
      prop: 'value',
    })
    class App2 implements AbstractAssemblage {
      // Merge with custom interface for type-safety
      customDefinition?: CustomDecoratorConfig;

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

        // Not defined yet: `CustomDecorator` creates a subclass of `App2`, i.e. it is not yet instantiated.
        expect(this.customDefinition).toBeUndefined();
      }

      public onInit(): void {
        // Definition is now defined - type-safe access
        expect(this.customDefinition).toStrictEqual({
          prop: 'value',
        });
        expect(this.customDefinition?.prop).toBe('value');
      }
    }

    Assembler.build(App2);
  });
});
