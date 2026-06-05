import type { RouteRecordRaw } from 'vue-router';
import AboutWindow from './AboutWindow.vue';
import { AboutWindowConfig } from '../universal/window.config';

export const route: RouteRecordRaw = {
  path: AboutWindowConfig.route,
  name: AboutWindowConfig.name,
  component: AboutWindow,
};
