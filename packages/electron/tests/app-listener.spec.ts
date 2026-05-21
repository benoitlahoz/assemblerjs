import 'reflect-metadata';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AbstractAssemblage,
  Assemblage,
  Assembler,
  Dispose,
} from 'assemblerjs';

const appOn = vi.fn();
const appOff = vi.fn();
const whenReady = vi.fn(async () => undefined);

vi.mock('electron', () => ({
  app: {
    on: appOn,
    off: appOff,
    whenReady,
  },
}));

describe('AppListener lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('removes registered app listeners on dispose', async () => {
    const { AppListener } =
      await import('../src/main/app/app-listener.decorator');
    const { AppOn } = await import('../src/main/app/app-on.decorator');

    @AppListener()
    @Assemblage()
    class AppModule implements AbstractAssemblage {
      public calls: string[] = [];
      private disposeFunction!: () => Promise<void>;

      constructor(@Dispose() dispose: () => Promise<void>) {
        this.disposeFunction = dispose;
      }

      @AppOn('ready')
      public onReady(value: string): void {
        this.calls.push(value);
      }

      public async dispose(): Promise<void> {
        await this.disposeFunction();
      }
    }

    const module = Assembler.build(AppModule);

    expect(appOn).toHaveBeenCalledTimes(1);
    expect(appOn).toHaveBeenCalledWith('ready', expect.any(Function));

    const registeredListener = appOn.mock.calls[0][1];
    registeredListener('boot');
    expect(module.calls).toEqual(['boot']);

    await module.dispose();

    expect(appOff).toHaveBeenCalledWith('ready', registeredListener);
  });
});
