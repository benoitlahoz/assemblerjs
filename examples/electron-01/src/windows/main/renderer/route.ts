import type { RouteRecordRaw } from 'vue-router';
import MainWindow from './MainWindow.vue';
import { MAIN_WINDOW_CONFIG } from '../universal/window.config';

export const route: RouteRecordRaw = {
  path: MAIN_WINDOW_CONFIG.route,
  name: MAIN_WINDOW_CONFIG.name,
  component: MainWindow,
};
