import { describe, expectTypeOf, it } from 'vitest';
import { WindowIpcChannel } from '../src/universal/channels';
import type {
  DefaultIpcContractMap,
  IpcArgsFor,
  IpcResponseFor,
  WindowBounds,
} from '../src/universal/types';

describe('ipc contract types', () => {
  it('types known invoke channels', () => {
    expectTypeOf<
      IpcArgsFor<DefaultIpcContractMap, WindowIpcChannel.GetBounds>
    >().toEqualTypeOf<[name: string]>();

    expectTypeOf<
      IpcResponseFor<DefaultIpcContractMap, WindowIpcChannel.GetBounds>
    >().toEqualTypeOf<{
      data: WindowBounds | null;
      err: Error | null;
    }>();
  });

  it('types known event channels', () => {
    expectTypeOf<
      IpcArgsFor<DefaultIpcContractMap, WindowIpcChannel.OnBoundsChanged>
    >().toEqualTypeOf<[bounds: WindowBounds]>();
  });
});