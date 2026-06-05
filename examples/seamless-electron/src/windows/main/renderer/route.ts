import type { RouteRecordRaw } from 'vue-router';
import MainWindow from './MainWindow.vue';
import { MainWindowConfig } from '../universal/window.config';

export const route: RouteRecordRaw = {
  path: MainWindowConfig.route,
  name: MainWindowConfig.name,
  component: MainWindow,
};
