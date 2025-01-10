import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import {
  AbstractAssemblage,
  AbstractAssembler,
  Assemblage,
  Assembler,
  AssemblerContext,
  Context,
  Dispose,
} from '../src';
import {
  AwaitableAssemblage,
  AwaitableChannels,
} from './fixtures/awaitable-simple/awaitable.assemblage';
import {
  AwaiterAssemblage,
  AwaiterChannels,
} from './fixtures/awaitable-simple/awaiter.assemblage';

describe('Awaitable', () => {
  it('should wait for dependency to be ready.', async () => {
    const ExpectedOrderedMessages: string[] = [
      AwaitableChannels.Init,
      AwaitableChannels.Inited,
      AwaiterChannels.Init,
      AwaitableChannels.Ready,
      AwaitableChannels.Resolved,
      AwaiterChannels.Resolved,
    ];
    const ReceivedMessages: string[] = [];

    @Assemblage({
      inject: [[AwaitableAssemblage], [AwaiterAssemblage]],
    })
    class App implements AbstractAssemblage {
      constructor(
        @Context() private context: AssemblerContext,
        @Dispose() public dispose: AbstractAssembler['dispose'],
        public awaitable: AwaitableAssemblage,
        public awaiter: AwaiterAssemblage
      ) {
        // 'AwaitableAssemblage' and 'AwaiterAssemblage' events are forwarded to 'Assembler'.

        this.context.on('*', (channel: string) => {
          ReceivedMessages.push(channel);
        });
      }

      public async onInit(): Promise<void> {
        // TODO: As of version 0.2.0 'onInit' hook is called just after an instance has been
        // built, making this entry point dependencies to be 'inited' before it.

        await this.awaitable.execute();
        await this.awaiter.execute();
      }

      public onDispose(context: AssemblerContext): void {}
    }

    const app: App = Assembler.build(App);

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        // Messages should have been received in a strict order.
        expect(ReceivedMessages).toStrictEqual(ExpectedOrderedMessages);

        app.dispose();

        // 'App' should be empty.
        expect(app.awaitable).toBeUndefined();
        expect(app.awaiter).toBeUndefined();
        expect(app.dispose).toBeUndefined();

        resolve();
      }, 200);
    });
  });
});
