import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';
import MainWindow from '@windows/main/renderer/MainWindow.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'main-window',
    component: MainWindow,
  },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
