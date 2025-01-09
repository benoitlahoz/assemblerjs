import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { Assemblage } from '../decorator';
import { AbstractAssemblage } from '../types';
import type { AssemblerContext } from '../../assembler/types';
import { Assembler } from '../../assembler/assembler';
import { Context, Configuration, Metadata } from '../../assembler/decorators';
import { getOwnCustomMetadata } from '../../common/reflection';
import {
  ReflectIsAssemblageFlag,
  ReflectIsControllerFlag,
} from '../../common/constants';

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

    public onInit(context: AssemblerContext): void | Promise<void> {
      const dep = context.require(AbstractMyDependentClass);
      console.log(dep);
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
