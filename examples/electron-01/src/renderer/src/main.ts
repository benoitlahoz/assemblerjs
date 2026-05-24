import { Assemblage, AbstractAssemblage, Assembler, AssemblerContext } from 'assemblerjs';
import { Task, Result } from '@assemblerjs/core';
import { App as VueApp, createApp } from 'vue';
import { IpcModule } from '@features/ipc/renderer/ipc.module';
import { SystemStateModule } from '@features/system/renderer/system-state.module';
import { MainWindow } from '@windows/main/renderer';
import { ContextInjectionKey } from '@common/keys';
import App from './App.vue';
import { router } from './router';

import './assets/main.css';

@Assemblage({
  provide: [[MainWindow], [IpcModule], [SystemStateModule]],
})
class MainApp implements AbstractAssemblage {
  private app: VueApp;

  constructor() {
    this.app = createApp(App);
    this.app.use(router);
  }

  public async onInit(context: AssemblerContext): Promise<void> {
    this.app.provide(ContextInjectionKey, context);
    this.app.mount('#app');
  }
}

const task = Task.of(() => Assembler.build(MainApp));
task
  .fork<MainApp, Error>()
  .then((result: Result<MainApp, Error>) => {
    result.fold(
      (error) => {
        alert(`An error occurred while initializing the renderer process:\n${error.message}`);
        window.close();
      },
      () => {
        console.log('Renderer was successfully initialized.');
      },
    );
  })
  .catch((error) => {
    alert(`An unexpected error occurred during renderer initialization:\n${error.message}`);
    window.close();
  });
