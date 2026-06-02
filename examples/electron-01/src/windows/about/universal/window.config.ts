export const ABOUT_WINDOW_CONFIG = {
  name: 'about',
  route: '/about',
} as const;

export type AboutWindowName = (typeof ABOUT_WINDOW_CONFIG)['name'];
export type AboutWindowRoute = (typeof ABOUT_WINDOW_CONFIG)['route'];
