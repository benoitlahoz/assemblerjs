import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import {
  AbstractAssemblage,
  Assemblage,
  Assembler,
  AssemblerContext,
  Context,
} from '../src';
import { EmitterAssemblage } from './fixtures/events-simple/emitter.service';
import { SubscriberAssemblage } from './fixtures/events-simple/subscriber.service';

describe('EventsSimple', () => {
  it('should send and receive events.', () => {
    @Assemblage({
      inject: [[EmitterAssemblage], [SubscriberAssemblage]],
    })
    class App implements AbstractAssemblage {
      constructor(@Context() public context: AssemblerContext) {}
    }

    const app: App = Assembler.build(App);
    const subscriber: SubscriberAssemblage =
      app.context.require(SubscriberAssemblage);

    setTimeout(() => {
      expect(subscriber.received).toBeTruthy();
    }, 500);
  });
});
