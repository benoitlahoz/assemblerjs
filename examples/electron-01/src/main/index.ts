import 'reflect-metadata';
import { AbstractAssemblage, Assemblage, Assembler } from 'assemblerjs';
import { app, shell, BrowserWindow } from 'electron';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import { Result, Task } from '@assemblerjs/core';
import { ElectronAppModule } from '@features/app/main/app.module';
import { IpcListenerService } from '@features/ipc/main/ipc.listener';

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

@Assemblage({
  provide: [[ElectronAppModule], [IpcListenerService]],
})
class MainApp implements AbstractAssemblage {
  constructor(
    public electron: ElectronAppModule,
    public ipc: IpcListenerService,
  ) {}
}

const task = Task.of(() => Assembler.build(MainApp));
task
  .fork<MainApp, Error>()
  .then((result: Result<MainApp, Error>) => {
    result.fold(
      (error) => {
        console.error(error);
        app.quit();
      },
      () => {
        console.log('App was successfully initialized.');
      },
    );
  })
  .catch((err) => {
    console.error(err);
    app.quit();
  });
