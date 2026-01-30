import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { Assembler, Assemblage, AbstractAssemblage, Context } from '../src';

describe('Object Manager', () => {
  it('should register and retrieve objects with string identifiers', () => {
    const testObject = { value: 'test-data' };

    @Assemblage({
      use: [['test-object', testObject]],
    })
    class App implements AbstractAssemblage {
      constructor(@Context() public context: any) {}
    }

    const app: App = Assembler.build(App);

    expect(app.context.has('test-object')).toBe(true);
    expect(app.context.require('test-object')).toBe(testObject);
  });

  it('should register and retrieve objects with symbol identifiers', () => {
    const testSymbol = Symbol('test');
    const testObject = { value: 'test-data' };

    @Assemblage({
      use: [[testSymbol, testObject]],
    })
    class App implements AbstractAssemblage {
      constructor(@Context() public context: any) {}
    }

    const app: App = Assembler.build(App);

    expect(app.context.has(testSymbol)).toBe(true);
    expect(app.context.require(testSymbol)).toBe(testObject);
  });

  it('should throw error when registering duplicate identifiers', () => {
    const obj1 = { value: 'first' };
    const obj2 = { value: 'second' };

    @Assemblage({
      use: [
        ['duplicate', obj1],
        ['duplicate', obj2],
      ],
    })
    class App implements AbstractAssemblage {}

    expect(() => Assembler.build(App)).toThrow(
      "Object/value 'duplicate' is already registered (cannot register twice)."
    );
  });

  it('should throw error when requiring unregistered identifier', () => {
    @Assemblage()
    class App implements AbstractAssemblage {
      constructor(@Context() public context: any) {}
    }

    const app: App = Assembler.build(App);

    expect(() => app.context.require('nonexistent')).toThrow(
      "Object/value 'nonexistent' has not been registered in the object store."
    );
  });

  it('should return undefined for unset global values', () => {
    @Assemblage()
    class App implements AbstractAssemblage {
      constructor(@Context() public context: any) {}
    }

    const app: App = Assembler.build(App);
    
    expect(app.context.global('nonexistent')).toBeUndefined();
  });
});
