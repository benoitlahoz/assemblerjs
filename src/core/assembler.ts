import type { Concrete, Identifier } from '@/types';
import { clearInstance } from '@/utils';
import { EventManager } from '@/events/event-manager';
import type { Injection } from '@/core/injection.types';
import { Injectable } from '@/core/injectable';
import type {
  AssemblerContext,
  AssemblerPrivateContext,
} from './assembler.types';
import { AbstractAssembler } from './assembler.types';
import { callHook } from '@/core/assemblage.hooks';
import { setDefinitionValue } from '@/core/assemblage.definition';
import { resolveInjectionTuple } from './injection.helpers';

export class Assembler extends EventManager implements AbstractAssembler {
  protected injectables: Map<Identifier<unknown>, Injectable<unknown>> =
    new Map();

  /**
   * Context passed to internal classes.
   */
  public readonly privateContext: AssemblerPrivateContext;

  /**
   * Context passed to assemblages.
   */
  public readonly publicContext: AssemblerContext;

  public static build<T>(entry: Concrete<T>): T {
    const assembler = new Assembler();

    // Entry assemblage is always a singleton.
    setDefinitionValue('singleton', true, entry);

    // Recursively register dependencies beginning from the entry concrete class.
    const injectable = assembler.register([entry]);

    // Return instance of entry assemblage.
    return assembler.require(injectable.identifier);
  }

  private constructor() {
    // EventManager listens to all events ('*') by default.
    super();

    this.publicContext = {
      register: this.register.bind(this),
      has: this.has.bind(this),
      require: this.require.bind(this),
      tagged: this.tagged.bind(this),
      on: this.on.bind(this),
      once: this.once.bind(this),
      off: this.off.bind(this),
      events: this.channels,
    };

    this.privateContext = {
      ...this.publicContext,
      emit: this.emit.bind(this),
      addChannels: this.addChannels.bind(this),
      removeChannels: this.removeChannels.bind(this),
      dispose: this.dispose.bind(this),
    };
  }

  public dispose(): void {
    for (const [_, injectable] of this.injectables) {
      injectable.dispose();
    }
    clearInstance(this, Assembler);
  }

  /**
   * Recursively register an `Injection` tuple and its inner injected dependencies.
   *
   * @param { Injection<T> } injection The injection tuple to register.
   */
  public register<T>(injection: Injection<T>): Injectable<T> {
    const buildable = resolveInjectionTuple(injection);

    if (this.has(buildable.identifier)) {
      throw new Error(
        `An assemblage is already registered with identifier '${buildable.identifier.name}'.`
      );
    }

    // This will register injectable's own dependencies.
    const injectable = Injectable.of<T>(
      buildable,
      this.privateContext,
      this.publicContext
    );

    this.injectables.set(injectable.identifier, injectable);

    // Call 'onRegister' hook.
    callHook(injectable.concrete, 'onRegister', this.publicContext);

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

  /**
   * Require dependencies by tag passed in assemblage's definition.
   *
   * @param { string | string[] } tags The tag(s) to get dependencies.
   * @returns { unknown[] } An array of instances for the given tags. If registered
   * identifier is not marked as 'singleton', will resolve in a new instance.
   */
  public tagged(...tags: string[]): unknown[] {
    const res: any[] = [];
    for (const tag of tags) {
      for (const [_, injectable] of this.injectables) {
        if (injectable.tags.includes(tag)) res.push(injectable.build());
      }
    }
    return res;
  }

  /**
   * Size of the assembler: number of registered dependencies.
   */
  public get size(): number {
    return this.injectables.size;
  }
}
