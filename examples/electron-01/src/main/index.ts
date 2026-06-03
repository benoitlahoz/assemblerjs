import 'reflect-metadata';
import { AbstractAssemblage, Assemblage, Assembler } from 'assemblerjs';
import { app } from 'electron';
import { join } from 'path';
import { Result, Task } from '@assemblerjs/core';
import { AbstractMenuControllerService, SystemStateHostService } from '@assemblerjs/electron';
import { ElectronAppModule } from '@features/app/main/app.module';
import { I18nService } from '@features/i18n/main';
import { IpcListenerService } from '@features/ipc/main/ipc.listener';
import { MenuControllerService } from '@menus/menu.controller';
import { WindowControllerService } from '@windows/window.controller';

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

@Assemblage({
  provide: [
    [ElectronAppModule],
    [I18nService],
    [IpcListenerService],
    [AbstractMenuControllerService, MenuControllerService],
    [WindowControllerService],
    [SystemStateHostService],
  ],
  global: {
    preload: join(__dirname, '../preload/index.js'),
  },
})
class MainApp implements AbstractAssemblage {
  constructor(
    public electron: ElectronAppModule,
    public ipc: IpcListenerService,
    public windows: WindowControllerService,
    public menus: AbstractMenuControllerService,
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
        console.log('App was successfully initialized.');
      },
    );
  })
  .catch((err) => {
    console.error(err);
    app.quit();
  });
