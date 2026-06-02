import type { RouteRecordRaw } from 'vue-router';
import AboutWindow from './AboutWindow.vue';
import { ABOUT_WINDOW_CONFIG } from '../universal/window.config';

export const route: RouteRecordRaw = {
  path: ABOUT_WINDOW_CONFIG.route,
  name: ABOUT_WINDOW_CONFIG.name,
  component: AboutWindow,
};
