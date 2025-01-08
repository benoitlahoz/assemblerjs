import type { Concrete, Identifier } from '@/types';
import type { Injection } from '@/injection/types';
import { defineCustomMetadata } from '@/common/reflection';
import { ReflectIsSingletonFlag } from '@/common/constants';
import { Injectable } from '@/injection/injectable';
import { AbstractAssembler } from './abstract';
import { AssemblerContext } from './context';

export class Assembler implements AbstractAssembler {
  protected injectables: Map<Identifier<unknown>, Injectable<unknown>> =
    new Map();

  public readonly context: AssemblerContext;

  public static build(entry: Concrete<any>) {
    return new Assembler(entry);
  }

  private constructor(entry: Concrete<any>) {
    this.context = new AssemblerContext(this);

    // Entry assemblage is always a singleton.
    defineCustomMetadata(ReflectIsSingletonFlag, true, entry);

    // Recursively register dependencies beginning from the entry concrete class.
    const injectable = this.register([entry]);
    return injectable.build();
  }

  /**
   * Recursively register an `Injection` tuple and its inner injected dependencies.
   *
   * @param { Injection<T> } injection The injection tuple to register.
   */
  public register<T>(injection: Injection<T>) {
    // This will register injectable's own dependencies.

    const injectable = Injectable.of<T>(injection, this.context);

    if (this.has(injectable.identifier)) {
      throw new Error(
        `An assemblage is already registered with identifier '${injectable.identifier.name}'.`
      );
    }

    this.injectables.set(injectable.identifier, injectable);
    return injectable;
  }

  /**
   * Check if `Assembler` has given identifier registered.
   *
   * @param { Identifier<T> } identifier An identifier (abstract or concrete class).
   * @returns { boolean } `true` if dependency has been registered.
   */
  public has<T>(identifier: Identifier<T>): boolean {
    return this.injectables.has(identifier);
  }

  /**
   * Get or instantiate an assemblage for given identifier.
   *
   * @param { Identifier<T> } identifier The identifier to get instance from.
   * @returns { T } An instance of Concrete<T>.
   */
  public require<T>(identifier: Identifier<T>): T {
    if (!this.injectables.has(identifier)) {
      throw new Error(
        `Assemblage with identifier '${identifier.name}' has not been registered.`
      );
    }

    const injectable = this.injectables.get(identifier)! as Injectable<T>;
    return injectable.build();
  }

  public tagged(...tags: string[]): any[] {
    const res: any[] = [];
    for (const tag of tags) {
      for (const [_, injectable] of this.injectables) {
        if (injectable.tags.includes(tag)) res.push(injectable.build() as any);
      }
    }
    return res;
  }
}
