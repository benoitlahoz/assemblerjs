import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { Assemblage } from '../decorator';
import { AbstractAssemblage } from '../types';
import type { AssemblerContext } from '../../assembler/types';
import { Assembler } from '../../assembler/assembler';
import { Context, Configuration, Definition } from '../../injection/decorators';
import { AssemblageDefinition } from '../definition';

describe('Assemblage Decorator', () => {
  @Assemblage()
  class MyDependencyClass implements AbstractAssemblage {
    public static onRegister(context: AssemblerContext): void {
      expect(context).toBeDefined();
      expect(context.has(MyDependencyClass)).toBeTruthy();
      expect(context.has(MyDependentClass)).toBeFalsy();
    }

    public foo: string;
    public ack: string;

    constructor(
      // private dep: MyDependentClass, // TODO: handle circular dependencies.
      @Context() private context: AssemblerContext,
      @Configuration() private configuration: any
    ) {
      this.foo = this.configuration.foo;
      this.ack = this.configuration.ack;
    }

    public onInit(context: AssemblerContext): void | Promise<void> {
      expect(context).toBeDefined();
    }
  }

  abstract class AbstractMyDependentClass extends AbstractAssemblage {
    public abstract foo: string;
  }

  @Assemblage({
    inject: [[MyDependencyClass, { foo: 'bar', baz: 'ack' }]],
  })
  class MyDependentClass implements AbstractMyDependentClass {
    public foo = 'sum';
    constructor(private dependency: MyDependencyClass) {}
  }

  abstract class AbstractMyAssemblage extends AbstractAssemblage {
    public abstract foo: string;
  }

  const metadata = {
    name: 'My Assemblage',
    version: '1.0.0',
  };

  @Assemblage({
    inject: [[AbstractMyDependentClass, MyDependentClass]],
    controller: true,
    path: '/api', // Mandatory if 'controller' is `true`.
    metadata,
  })
  class MyAssemblageClass implements AbstractMyAssemblage {
    public foo = 'bar';

    constructor(
      @Context() public context: AssemblerContext,
      @Definition() private definition: AssemblageDefinition
    ) {
      if (this.definition.metadata) {
        expect(this.definition.metadata.name).toBe(metadata.name);
        expect(this.definition.metadata.version).toBe(metadata.version);
      } else {
        throw new Error(
          `'MyAssemblageClass' should be able to get its own metadata.`
        );
      }
    }

    public onInit(context: AssemblerContext): void | Promise<void> {
      const dep = context.require(AbstractMyDependentClass);
      expect(dep).toBeDefined();
    }
  }

  it('should decorate a class with passed options.', () => {
    // Assemble from the entry point.
    const app = Assembler.build(MyAssemblageClass);

    const dependency: MyDependencyClass =
      app.context.require(MyDependencyClass);
    expect(dependency.foo).toBe('bar');

    const dependent: AbstractMyDependentClass = app.context.require(
      AbstractMyDependentClass
    );
    expect(dependent.foo).toBe('sum');
  });
});
