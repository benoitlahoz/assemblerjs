export const MAIN_WINDOW_CONFIG = {
  name: 'main',
  route: '/',
} as const;

export type MainWindowName = (typeof MAIN_WINDOW_CONFIG)['name'];
export type MainWindowRoute = (typeof MAIN_WINDOW_CONFIG)['route'];
