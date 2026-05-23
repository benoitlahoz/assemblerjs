export const MAIN_WINDOW_NAME = 'main' as const;

export const MAIN_WINDOW_CONFIG = {
  name: MAIN_WINDOW_NAME,
} as const;

export type MainWindowName = typeof MAIN_WINDOW_NAME;
