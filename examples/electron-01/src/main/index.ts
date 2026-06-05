import 'reflect-metadata';
import { AbstractAssemblage, Assemblage, Assembler } from 'assemblerjs';
import { app } from 'electron';
import { join } from 'path';
import { Result, Task } from '@assemblerjs/core';
import { AbstractWindowController, SystemStateHostService } from '@assemblerjs/electron';
import { ElectronAppModule } from '@features/app/main/app.module';
import { I18nService } from '@features/i18n/main';
import { IpcListenerService } from '@features/ipc/main/ipc.listener';
import { MenuController } from '@menus/menu.controller';
import { WindowControllerService } from '@windows/window.controller';

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

@Assemblage({
  provide: [
    [ElectronAppModule],
    [I18nService],
    [IpcListenerService],
    [MenuController],
    [AbstractWindowController, WindowControllerService],
    [SystemStateHostService],
  ],
  global: {
    env: {
      preload: join(__dirname, '../preload/index.js'),
      file: join(__dirname, '../renderer/index.html'),
      dev: process.env['ELECTRON_RENDERER_URL'],
    },
  },
})
class MainApp implements AbstractAssemblage {
  constructor(
    public electron: ElectronAppModule,
    public ipc: IpcListenerService,
    public windows: AbstractWindowController,
    public menus: MenuController,
    public systemState: SystemStateHostService,
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
        // App was successfully initialized.
      },
    );
  })
  .catch((err) => {
    console.error(err);
    app.quit();
  });
