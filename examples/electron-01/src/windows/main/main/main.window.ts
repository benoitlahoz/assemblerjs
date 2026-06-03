import { AbstractAssemblage, Assemblage, Global } from 'assemblerjs';
import { shell, type Rectangle } from 'electron';
import { join } from 'path';
import { ElectronWindow, UseMenu, Window, WindowCommand } from '@assemblerjs/electron';
import { MainMenu } from '@menus/main.menu';
import { MAIN_WINDOW_CONFIG } from '../universal/window.config';

const MAIN_WINDOW_INITIAL_WIDTH = 1280;
const MAIN_WINDOW_INITIAL_HEIGHT = 900;
const MAIN_WINDOW_MIN_WIDTH = 520;
const MAIN_WINDOW_MIN_HEIGHT = 360;

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
  name: MAIN_WINDOW_CONFIG.name,
  width: MAIN_WINDOW_INITIAL_WIDTH,
  height: MAIN_WINDOW_INITIAL_HEIGHT,
  show: false,
  autoHideMenuBar: true,
  webPreferences: {
    sandbox: false,
  },
  router: {
    file: join(__dirname, '../renderer/index.html'),
    dev: process.env['ELECTRON_RENDERER_URL'],
    route: MAIN_WINDOW_CONFIG.route,
  },
})
@UseMenu(MainMenu)
@Assemblage({ singleton: false })
export class MainWindow extends ElectronWindow implements AbstractAssemblage {
  constructor(@Global('preload') preload: string) {
    super({
      webPreferences: {
        preload,
      },
    });
  }

  public async onInit(): Promise<void> {
    this.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url);
      return { action: 'deny' };
    });
  }

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

    const minWidth = Math.max(MAIN_WINDOW_MIN_WIDTH, minWindowWidth || 0);
    const minHeight = Math.max(MAIN_WINDOW_MIN_HEIGHT, minWindowHeight || 0);
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

    this.setSize(MAIN_WINDOW_INITIAL_WIDTH, MAIN_WINDOW_INITIAL_HEIGHT, false);
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
    const minWidth = Math.max(MAIN_WINDOW_MIN_WIDTH, minWindowWidth || 0);
    const minHeight = Math.max(MAIN_WINDOW_MIN_HEIGHT, minWindowHeight || 0);

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
}
