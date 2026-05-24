import { app } from 'electron';
import { Await } from '@assemblerjs/core';
import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { AppEventsListener } from './services/app-events.listener';
import { electronApp } from '@electron-toolkit/utils';

@Assemblage({
  provide: [[AppEventsListener]],
})
export class ElectronAppModule implements AbstractAssemblage {
  protected ready = false;

  constructor(public eventsListener: AppEventsListener) {}

  public async onInit(): Promise<void> {
    await app.whenReady();

    // TODO: We want to get rid of this dependency to electron-toolkit/utils and implement our own solution for devtools and reload shortcuts
    electronApp.setAppUserModelId('com.electron');

    this.ready = true;
  }

  @Await('ready')
  public async whenReady(): Promise<void> {
    return;
  }
}
