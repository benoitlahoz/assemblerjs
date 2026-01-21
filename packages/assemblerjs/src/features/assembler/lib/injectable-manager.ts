import type { Identifier } from '@/shared/common';
import type { Injection, InstanceInjection } from '@/features/assemblage';
import {
  resolveInjectionTuple,
  resolveInstanceInjectionTuple,
} from '@/features/assemblage';
import { Injectable } from '@/features/injectable';
import type { AssemblerContext, AssemblerPrivateContext } from '../model/types';
import { HookManager } from './hook-manager';
import { SingletonStrategy, TransientStrategy } from './resolution-strategies';

export class InjectableManager {
  private injectables: Map<Identifier<unknown>, Injectable<unknown>> = new Map();
  private privateContext!: AssemblerPrivateContext;
  private publicContext!: AssemblerContext;
  private singletonStrategy = new SingletonStrategy();
  private transientStrategy = new TransientStrategy();

  public setContexts(privateContext: AssemblerPrivateContext, publicContext: AssemblerContext): void {
    this.privateContext = privateContext;
    this.publicContext = publicContext;
  }

  public register<T>(injection: Injection<T>, instance = false): Injectable<T> {
    const buildable =
      instance === true
        ? resolveInstanceInjectionTuple(injection as InstanceInjection<T>)
        : resolveInjectionTuple(injection);

    if (this.has(buildable.identifier)) {
      throw new Error(
        `An assemblage is already registered with identifier '${buildable.identifier.name}'.`
      );
    }

    // Recursively register injectable's own dependencies.
    const injectable = Injectable.of<T>(
      buildable as any,
      this.privateContext,
      this.publicContext
    );

    // Cache injectable.
    this.injectables.set(injectable.identifier as Identifier<T>, injectable);

    // Call 'onRegister' hook only when a concrete assemblage exists.
    if (injectable.concrete) {
      HookManager.callHook(
        injectable.concrete,
        'onRegister',
        this.publicContext,
        injectable.configuration
      );
    }

    return injectable as Injectable<T>;
  }

  public has<T>(identifier: Identifier<T>): boolean {
    return this.injectables.has(identifier as Identifier<T>);
  }

  public require<T>(
    identifier: Identifier<T>,
    configuration?: Record<string, any>
  ): T {
    if (!this.injectables.has(identifier as Identifier<T>)) {
      throw new Error(
        `Class with identifier '${
          (identifier as Identifier<T>).name
        }' has not been registered or is a circular dependency.`
      );
    }

    const injectable = this.injectables.get(
      identifier as Identifier<T>
    )! as Injectable<T>;

    if (injectable.isSingleton) {
      return this.singletonStrategy.resolve(injectable, configuration);
    } else {
      return this.transientStrategy.resolve(injectable, configuration);
    }
  }

  public concrete<T>(identifier: Identifier<T>): any | undefined {
    const injectable = this.injectables.get(identifier as Identifier<T>);

    if (injectable) return injectable.concrete;

    return;
  }

  public tagged(...tags: string[]): unknown[] {
    const res: any[] = [];
    for (const tag of tags) {
      for (const [_, injectable] of this.injectables) {
        if (injectable.tags.includes(tag)) res.push(injectable.build());
      }
    }
    return res;
  }

  public dispose(): void {
    for (const [_, injectable] of this.injectables) {
      injectable.dispose();
    }
  }

  public get size(): number {
    return this.injectables.size;
  }
}