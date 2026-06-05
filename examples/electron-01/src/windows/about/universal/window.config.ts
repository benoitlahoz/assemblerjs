export const AboutWindowConfig = {
  name: 'about',
  route: '/about',
  width: 480,
  height: 480,
  show: false,
  maximizable: false,
  minimizable: false,
  resizable: false,
  autoHideMenuBar: true,
  webPreferences: {
    sandbox: false,
  },
} as const;

export type AboutWindowName = (typeof AboutWindowConfig)['name'];
export type AboutWindowRoute = (typeof AboutWindowConfig)['route'];
