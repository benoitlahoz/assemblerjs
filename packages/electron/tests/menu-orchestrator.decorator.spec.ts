import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { Assemblage, getAssemblageDefinition } from 'assemblerjs';

vi.mock('electron', () => {
  class BrowserWindow {}

  return {
    BrowserWindow,
    Menu: {
      setApplicationMenu: vi.fn(),
      buildFromTemplate: vi.fn(() => ({})),
      getApplicationMenu: vi.fn(() => undefined),
    },
    ipcMain: {
      on: vi.fn(),
      once: vi.fn(),
      off: vi.fn(),
      handle: vi.fn(),
      removeHandler: vi.fn(),
    },
  };
});

describe('MenuOrchestrator decorator', () => {
  it('keeps existing provide definition while composing menu lifecycle', async () => {
    const { MenuOrchestrator } =
      await import('../src/main/menu/menu-orchestration/menu-orchestrator.decorator');
    const { AbstractMenuController } =
      await import('../src/main/menu/services/menu-controller-support');

    class DeveloperToolsMenu {}

    class MainMenu {}

    @MenuOrchestrator()
    @Assemblage({ provide: [[DeveloperToolsMenu], [MainMenu]] })
    class OrchestratedMenuController extends AbstractMenuController {}

    const definition = getAssemblageDefinition(
      OrchestratedMenuController as any,
    );
    const provides = Array.isArray(definition?.provide)
      ? definition.provide
      : [];

    expect(provides).toEqual([[DeveloperToolsMenu], [MainMenu]]);
  });
});
