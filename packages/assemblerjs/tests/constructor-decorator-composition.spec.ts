import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import {
  Assemblage,
  Assembler,
  Context,
  Use,
  createConstructorDecorator,
  type AssemblerContext,
} from '../src';

describe('constructor decorator composition', () => {
  it.each([1, 2, 3])(
    'preserves Context injection through %i constructor wrappers',
    (wrapperCount) => {
      @Assemblage()
      class Dependency {}

      @Assemblage({
        provide: [[Dependency]],
        use: [['label', 'menu']],
      })
      class Service {
        constructor(
          @Context() public readonly context: AssemblerContext,
          public readonly dependency: Dependency,
          @Use('label') public readonly label: string,
        ) {}
      }

      let decorated = Service;
      const wrap = createConstructorDecorator(function () {});
      for (let i = 0; i < wrapperCount; i++) {
        decorated = wrap()(decorated);
      }

      const service = Assembler.build(decorated);

      expect(service.context.require(Dependency)).toBe(service.dependency);
      expect(service.dependency).toBeInstanceOf(Dependency);
      expect(service.label).toBe('menu');
    },
  );
});
