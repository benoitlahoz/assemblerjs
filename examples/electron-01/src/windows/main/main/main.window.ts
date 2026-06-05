import { AbstractAssemblage, Assemblage, Global } from 'assemblerjs';
import { shell, type Rectangle } from 'electron';

import {
  ElectronWindow,
  UseMenu,
  Window,
  WindowCommand,
  WindowForward,
  WindowOn,
} from '@assemblerjs/electron';
import { AppMenu } from '@menus/app';
import { EditMenu } from '@menus/edit';
import { WindowMenu } from '@menus/window';
import { DeveloperToolsMenu } from '@menus/developer';
import { MainWindowConfig } from '../universal/window.config';
import type { WindowEnv } from '../../window.env';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function normalizeBounds(input: Rectangle, minWidth: number, minHeight: number): Rectangle {
  return {
    x: Math.round(input.x),
    y: Math.round(input.y),
    width: Math.max(minWidth, Math.round(input.width)),
    height: Math.max(minHeight, Math.round(input.height)),
  };
}

@Window({
  name: MainWindowConfig.name,
  width: MainWindowConfig.initialWidth,
  height: MainWindowConfig.initialHeight,
  show: MainWindowConfig.show,
  autoHideMenuBar: MainWindowConfig.autoHideMenuBar,
  webPreferences: {
    sandbox: MainWindowConfig.webPreferences.sandbox,
  },
  router: {
    route: MainWindowConfig.route,
  },
  titleBar: {
    enabled: MainWindowConfig.titleBar.enabled,
    height: MainWindowConfig.titleBar.height,
    color: MainWindowConfig.titleBar.color,
    symbolColor: MainWindowConfig.titleBar.symbolColor,
    trafficLightPosition: MainWindowConfig.titleBar.trafficLightPosition,
  },
})
@UseMenu([AppMenu, EditMenu, WindowMenu, DeveloperToolsMenu])
@Assemblage()
export class MainWindow extends ElectronWindow implements AbstractAssemblage {
  constructor(@Global('env') env: WindowEnv) {
    super({
      webPreferences: {
        preload: env.preload,
      },
      router: {
        file: env.file,
        dev: env.dev,
      },
    });
  }

  public async onInit(): Promise<void> {
    this.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url);
      return { action: 'deny' };
    });
  }

  @WindowOn('ready-to-show')
  public onReadyToShow(): void {
    const title = 'Full-Duplex Electron';
    this.setTitle(title);
    // Emit title change event to renderer
    this.webContents.send(`window:${this.name}.title-changed`, title);
    this.center();
  }

  // ========================================
  // Event Forwarding (Main → Renderer)
  // ========================================

  @WindowForward('resize')
  @WindowForward('move')
  public onBoundsChanged(): Rectangle {
    return this.getBounds();
  }

  @WindowForward('enter-full-screen')
  @WindowForward('leave-full-screen')
  public onFullScreenChanged(): Rectangle {
    return this.getBounds();
  }

  // ========================================
  // Window Commands (Renderer → Main RPC)
  // ========================================

  @WindowCommand('getBounds')
  public getBoundsCommand(): Rectangle {
    return this.getBounds();
  }

  @WindowCommand('getDisplayWorkArea')
  public getDisplayWorkAreaCommand(): Rectangle {
    return this.currentDisplay.workArea;
  }

  @WindowCommand('getDisplayBounds')
  public getDisplayBoundsCommand(): Rectangle {
    return this.currentDisplay.bounds;
  }

  @WindowCommand('randomBounds')
  public randomBoundsCommand(): Rectangle {
    if (this.isFullScreen()) {
      this.setFullScreen(false);
    }

    if (this.isMinimized()) {
      this.restore();
    }

    if (this.isMaximized()) {
      this.unmaximize();
    }

    const workArea = this.currentDisplay.workArea;
    const [minWindowWidth, minWindowHeight] = this.getMinimumSize();

    const minWidth = Math.max(MainWindowConfig.minWidth, minWindowWidth || 0);
    const minHeight = Math.max(MainWindowConfig.minHeight, minWindowHeight || 0);
    const maxWidth = Math.max(minWidth, Math.floor(workArea.width * 0.92));
    const maxHeight = Math.max(minHeight, Math.floor(workArea.height * 0.9));

    const width = randomInt(minWidth, maxWidth);
    const height = randomInt(minHeight, maxHeight);

    const xMin = workArea.x;
    const yMin = workArea.y;
    const xMax = Math.max(xMin, workArea.x + workArea.width - width);
    const yMax = Math.max(yMin, workArea.y + workArea.height - height);

    const x = randomInt(xMin, xMax);
    const y = randomInt(yMin, yMax);

    const before = this.getBounds();

    this.setBounds({ x, y, width, height }, false);

    const afterSetBounds = this.getBounds();
    const unchanged =
      afterSetBounds.x === before.x &&
      afterSetBounds.y === before.y &&
      afterSetBounds.width === before.width &&
      afterSetBounds.height === before.height;

    if (unchanged) {
      // Some environments/window states may ignore setBounds; force size + position separately.
      this.setSize(width, height, false);
      this.setPosition(x, y, false);
    }

    this.moveTop();
    this.focus();

    return this.getBounds();
  }

  @WindowCommand('refreshBounds')
  public refreshBoundsCommand(): Rectangle {
    if (this.isFullScreen()) {
      this.setFullScreen(false);
    }

    if (this.isMinimized()) {
      this.restore();
    }

    if (this.isMaximized()) {
      this.unmaximize();
    }

    this.setSize(MainWindowConfig.initialWidth, MainWindowConfig.initialHeight, false);
    this.center();
    this.moveTop();
    this.focus();

    return this.getBounds();
  }

  @WindowCommand('centerWindow')
  public centerWindowCommand(): Rectangle {
    if (this.isMinimized()) {
      this.restore();
    }

    this.center();
    this.moveTop();

    return this.getBounds();
  }

  @WindowCommand('setBounds')
  public setBoundsCommand(nextBounds: Rectangle): Rectangle {
    if (this.isFullScreen()) {
      this.setFullScreen(false);
    }

    if (this.isMinimized()) {
      this.restore();
    }

    if (this.isMaximized()) {
      this.unmaximize();
    }

    const [minWindowWidth, minWindowHeight] = this.getMinimumSize();
    const minWidth = Math.max(MainWindowConfig.minWidth, minWindowWidth || 0);
    const minHeight = Math.max(MainWindowConfig.minHeight, minWindowHeight || 0);

    const normalized = normalizeBounds(nextBounds, minWidth, minHeight);
    const before = this.getBounds();

    this.setBounds(normalized, false);

    const afterSetBounds = this.getBounds();
    const unchanged =
      afterSetBounds.x === before.x &&
      afterSetBounds.y === before.y &&
      afterSetBounds.width === before.width &&
      afterSetBounds.height === before.height;

    if (unchanged) {
      this.setSize(normalized.width, normalized.height, false);
      this.setPosition(normalized.x, normalized.y, false);
    }

    this.moveTop();
    this.focus();

    return this.getBounds();
  }

  @WindowCommand('setAlwaysOnTop')
  public setAlwaysOnTopCommand(flag: boolean): boolean {
    this.setAlwaysOnTop(flag);
    return this.isAlwaysOnTop();
  }

  @WindowCommand('isAlwaysOnTop')
  public isAlwaysOnTopCommand(): boolean {
    return this.isAlwaysOnTop();
  }
}
