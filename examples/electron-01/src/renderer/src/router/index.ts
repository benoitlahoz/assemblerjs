import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';

type WindowRouteModule = {
  route: RouteRecordRaw;
};

const windowRouteModules = import.meta.glob<WindowRouteModule>('@windows/**/renderer/route.ts', {
  eager: true,
});

const routes: RouteRecordRaw[] = Object.values(windowRouteModules).map(
  (routeModule) => routeModule.route,
);

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
