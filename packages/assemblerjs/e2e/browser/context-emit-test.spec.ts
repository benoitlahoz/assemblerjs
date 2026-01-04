/**
 * Simple test to verify EventManager and emit() work correctly
 */
import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { Assemblage, Assembler, AbstractAssemblage, Context, AssemblerContext, EventManager } from '../../src';

describe('Context Emit Test', () => {
  it('should emit events using EventManager', () => {
    const events: string[] = [];

    @Assemblage({
      events: ['test:event'],
    })
    class EventEmitter extends EventManager implements AbstractAssemblage {
      constructor() {
        super('test:event');
      }

      emitTest() {
        this.emit('test:event', 'hello');
      }
    }

    @Assemblage({
      inject: [[EventEmitter]],
    })
    class Consumer implements AbstractAssemblage {
      constructor(
        @Context() private context: AssemblerContext,
        private emitter: EventEmitter
      ) {}

      onInit() {
        this.context.on('test:event', (msg: string) => {
          events.push(msg);
        });
      }

      trigger() {
        this.emitter.emitTest();
      }
    }

    const consumer = Assembler.build(Consumer);
    consumer.trigger();

    expect(events).toEqual(['hello']);
  });
});
