import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import {
  AbstractAssemblage,
  Assemblage,
  Assembler,
  Use,
  decorateAssemblage,
} from '../src';

describe('FunctionDecorator', () => {
  it('should create an assemblage with a function.', () => {
    abstract class AbstractClass {
      public env: any;
    }
    class NotAnAssemblage implements AbstractClass {
      constructor(@Use('env') public env: any) {}
    }
    const AnAssemblage = decorateAssemblage(NotAnAssemblage);

    @Assemblage({
      inject: [[AbstractClass, AnAssemblage]],
      use: [['env', { foo: 'bar' }]],
    })
    class App implements AbstractAssemblage {
      constructor(public manual: AbstractClass) {}
    }

    const app: App = Assembler.build(App);
    expect(app.manual.env.foo).toBe('bar');
  });
});
