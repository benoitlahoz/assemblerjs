import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { Assemblage } from '../decorator';
import { AbstractAssemblage } from '../abstract';
import { Assembler } from '../../assembler/assembler';
import { AssemblerContext } from '../../assembler/context';
import { Context, Configuration, Metadata } from '../../assembler/decorators';
import { getOwnCustomMetadata } from '../../common/reflection';
import {
  ReflectIsAssemblageFlag,
  ReflectIsControllerFlag,
} from '../../common/constants';

describe('Assemblage Decorator', () => {
  @Assemblage()
  class MyDependencyClass implements AbstractAssemblage {
    public foo: string;
    public ack: string;
    constructor(
      // private dep: MyDependentClass, // TODO: handle circular dependencies.
      @Context() private context: AssemblerContext,
      @Configuration() private configuration: any
    ) {
      this.foo = this.configuration.foo;
      this.ack = this.configuration.ack;
      // TODO: réimplémenter onInit pour require. Maximum call stack.
      // const dep = this.context.require(AbstractMyDependentClass);
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
    path: '/', // Mandatory if 'controller' is `true`.
    metadata,
  })
  class MyAssemblageClass implements AbstractMyAssemblage {
    public foo = 'bar';

    constructor(
      @Context() public context: AssemblerContext,
      @Metadata() private metadata: Record<string, any>
    ) {
      expect(this.metadata.name).toBe(metadata.name);
      expect(this.metadata.version).toBe(metadata.version);
    }
  }

  it('should decorate a class with passed options.', () => {
    expect(getOwnCustomMetadata('inject', MyAssemblageClass)).toBeTypeOf(
      'object'
    );
    expect(getOwnCustomMetadata('metadata', MyAssemblageClass)).toStrictEqual(
      metadata
    );

    // Assemble from the entry point.
    const app = Assembler.build(MyAssemblageClass);

    // Get typed assemblage by passing a generic.
    const dependency =
      app.context.require<MyDependencyClass>(MyDependencyClass);
    expect(dependency.foo).toBe('bar');

    // Get typed assemblage by setting variable type.
    const dependent: AbstractMyDependentClass = app.context.require(
      AbstractMyDependentClass
    );
    expect(dependent.foo).toBe('sum');
  });
});
