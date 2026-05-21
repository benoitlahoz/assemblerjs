import { describe, expect, it, vi } from 'vitest';
import type {
  AbstractWindowRendererService,
  WindowSnapshot,
} from '../src/renderer/window/services/window-renderer.abstract';
import { AbstractScopedWindowRendererService } from '../src/renderer/window/services/window-renderer-scoped.abstract';
import type { WindowBounds, WindowState } from '../src/universal/types';

class MainWindowRendererService extends AbstractScopedWindowRendererService {
  protected readonly windowName = 'main';
}

describe('AbstractScopedWindowRendererService', () => {
  it('delegates commands to the injected window service with fixed window name', async () => {
    const windows = {
      getBounds: vi.fn().mockResolvedValue(undefined),
      focus: vi.fn().mockResolvedValue(undefined),
      setVisible: vi.fn().mockResolvedValue(undefined),
      setMinimized: vi.fn().mockResolvedValue(undefined),
      setMaximized: vi.fn().mockResolvedValue(undefined),
      restore: vi.fn().mockResolvedValue(undefined),
      pin: vi.fn().mockResolvedValue(true),
      snapshot: vi.fn().mockReturnValue(undefined),
      trackWindow: vi.fn().mockReturnValue(() => undefined),
      onBoundsChanged: vi.fn().mockReturnValue(() => undefined),
      onStateChanged: vi.fn().mockReturnValue(() => undefined),
      onFullscreenChanged: vi.fn().mockReturnValue(() => undefined),
    } as unknown as AbstractWindowRendererService;

    const service = new MainWindowRendererService(windows);

    await service.getBounds();
    await service.focus();
    await service.setVisible(true);
    await service.setMinimized(false);
    await service.setMaximized(true);
    await service.restore();
    await service.pin(true);

    expect((windows as any).getBounds).toHaveBeenCalledWith('main');
    expect((windows as any).focus).toHaveBeenCalledWith('main');
    expect((windows as any).setVisible).toHaveBeenCalledWith('main', true);
    expect((windows as any).setMinimized).toHaveBeenCalledWith('main', false);
    expect((windows as any).setMaximized).toHaveBeenCalledWith('main', true);
    expect((windows as any).restore).toHaveBeenCalledWith('main');
    expect((windows as any).pin).toHaveBeenCalledWith('main', true);
  });

  it('delegates subscriptions and snapshots with fixed window name', () => {
    const unsub = () => undefined;
    const windows = {
      getBounds: vi.fn(),
      focus: vi.fn(),
      setVisible: vi.fn(),
      setMinimized: vi.fn(),
      setMaximized: vi.fn(),
      restore: vi.fn(),
      pin: vi.fn(),
      snapshot: vi.fn().mockReturnValue({
        name: 'main',
        updatedAt: Date.now(),
      } as WindowSnapshot),
      trackWindow: vi.fn().mockReturnValue(unsub),
      onBoundsChanged: vi.fn().mockReturnValue(unsub),
      onStateChanged: vi.fn().mockReturnValue(unsub),
      onFullscreenChanged: vi.fn().mockReturnValue(unsub),
    } as unknown as AbstractWindowRendererService;

    const service = new MainWindowRendererService(windows);

    const onBounds = (bounds: WindowBounds) => bounds;
    const onState = (state: WindowState) => state;
    const onFullscreen = (active: boolean) => active;

    service.snapshot();
    service.trackWindow();
    service.onBoundsChanged(onBounds);
    service.onStateChanged(onState);
    service.onFullscreenChanged(onFullscreen);

    expect((windows as any).snapshot).toHaveBeenCalledWith('main');
    expect((windows as any).trackWindow).toHaveBeenCalledWith('main');
    expect((windows as any).onBoundsChanged).toHaveBeenCalledWith(
      'main',
      onBounds,
    );
    expect((windows as any).onStateChanged).toHaveBeenCalledWith(
      'main',
      onState,
    );
    expect((windows as any).onFullscreenChanged).toHaveBeenCalledWith(
      'main',
      onFullscreen,
    );
  });
});
