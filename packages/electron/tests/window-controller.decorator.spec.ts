import 'reflect-metadata';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Assemblage, Assembler, getAssemblageDefinition } from 'assemblerjs';

const getAllWindows = vi.fn();
const ipcMainHandle = vi.fn();
const ipcMainRemoveHandler = vi.fn();

vi.mock('electron', () => {
  class BrowserWindow {}

  return {
    BrowserWindow: Object.assign(BrowserWindow, {
      getAllWindows,
    }),
    screen: {
      getDisplayMatching: vi.fn(() => ({
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      })),
    },
    ipcMain: {
      on: vi.fn(),
      once: vi.fn(),
      off: vi.fn(),
      handle: ipcMainHandle,
      removeHandler: ipcMainRemoveHandler,
    },
  };
});

describe('WindowController decorator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('injects window registry helpers by default', async () => {
    getAllWindows.mockReturnValue([
      { name: 'main', isDestroyed: () => false },
      { name: 'settings', isDestroyed: () => false },
      { name: 'destroyed', isDestroyed: () => true },
    ]);

    const { WindowController } =
      await import('../src/main/window/window-controller/window-controller.decorator');

    @WindowController()
    @Assemblage()
    class RegistryController {}

    const controller = Assembler.build(RegistryController) as any;

    expect(controller.listWindowNames()).toEqual(['main', 'settings']);
    expect(controller.hasWindow('main')).toBe(true);
    expect(controller.hasWindow('missing')).toBe(false);
    expect(controller.getWindow('settings')?.name).toBe('settings');
    expect(() => controller.requireWindow('missing')).toThrow(
      'Window not found: missing',
    );
  });

  it('does not override custom registry methods', async () => {
    const { WindowController } =
      await import('../src/main/window/window-controller/window-controller.decorator');

    @WindowController()
    @Assemblage()
    class CustomRegistryController {
      public listWindowNames(): string[] {
        return ['custom'];
      }
    }

    const controller = Assembler.build(CustomRegistryController) as any;
    expect(controller.listWindowNames()).toEqual(['custom']);
  });

  it('opens singleton-like windows once by default (multiple=false)', async () => {
    getAllWindows.mockReturnValue([]);

    const { WindowController } =
      await import('../src/main/window/window-controller/window-controller.decorator');
    const { Window } =
      await import('../src/main/window/window-definition/window.decorator');

    @Window({ name: 'main' })
    @Assemblage({ singleton: true })
    class MainWindow {
      public readonly id = Math.random();
      public isDestroyed() {
        return false;
      }
      public once(_event: string, _callback: () => void) {}
      public close() {}
    }

    @WindowController()
    @Assemblage({ provide: [[MainWindow]] })
    class AppWindowController {}

    const controller = Assembler.build(AppWindowController) as any;

    const first = await controller.openWindow(MainWindow);
    const second = await controller.openWindow(MainWindow);

    expect(first).toBe(second);
    expect(controller.listManagedWindows()).toEqual([
      expect.objectContaining({ name: 'main', multiple: false }),
    ]);
  });

  it('opens multiple instances when window definition enables multiple', async () => {
    getAllWindows.mockReturnValue([]);

    const { WindowController } =
      await import('../src/main/window/window-controller/window-controller.decorator');
    const { Window } =
      await import('../src/main/window/window-definition/window.decorator');

    @Window({ name: 'document', multiple: true })
    @Assemblage({ singleton: true })
    class DocumentWindow {
      public readonly id = Math.random();
      public isDestroyed() {
        return false;
      }
      public once(_event: string, _callback: () => void) {}
      public close() {}
    }

    @WindowController()
    @Assemblage({ provide: [[DocumentWindow]] })
    class AppWindowController {}

    const controller = Assembler.build(AppWindowController) as any;

    const first = controller.openWindow(DocumentWindow);
    const second = controller.openWindow(DocumentWindow);

    expect(first).not.toBe(second);
  });

  it('forces managed window definitions to singleton=false before resolution', async () => {
    getAllWindows.mockReturnValue([]);

    const { WindowController } =
      await import('../src/main/window/window-controller/window-controller.decorator');
    const { Window } =
      await import('../src/main/window/window-definition/window.decorator');

    @Window({ name: 'forced-transient' })
    @Assemblage({ singleton: true })
    class ForcedTransientWindow {
      public isDestroyed() {
        return false;
      }
      public once(_event: string, _callback: () => void) {}
      public close() {}
    }

    @WindowController()
    @Assemblage({ provide: [[ForcedTransientWindow]] })
    class AppWindowController {}

    const controller = Assembler.build(AppWindowController) as any;
    controller.openWindow(ForcedTransientWindow);

    expect(getAssemblageDefinition(ForcedTransientWindow).singleton).toBe(
      false,
    );
  });

  it('registers WindowCommand handlers and exposes mandatory channels', async () => {
    getAllWindows.mockReturnValue([]);

    const { WindowController } =
      await import('../src/main/window/window-controller/window-controller.decorator');
    const { Window } =
      await import('../src/main/window/window-definition/window.decorator');
    const { WindowCommand } =
      await import('../src/main/window/window-command/window-command.decorator');

    @Window({ name: 'main' })
    @Assemblage({ singleton: true })
    class MainWindow {
      public isDestroyed() {
        return false;
      }
      public once(_event: string, _callback: () => void) {}
      public close() {}

      @WindowCommand('focus')
      public focus() {
        return 'focused';
      }
    }

    @WindowController()
    @Assemblage({ provide: [[MainWindow]] })
    class AppWindowController {}

    const controller = Assembler.build(AppWindowController) as any;

    expect(ipcMainHandle).toHaveBeenCalledWith(
      'window:main.focus',
      expect.any(Function),
    );
    expect(controller.listWindowChannels()).toContain('window:main.focus');
  });
});
