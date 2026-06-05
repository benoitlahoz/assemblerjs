export const MainWindowConfig = {
  name: 'main',
  route: '/',
  initialWidth: 1280,
  initialHeight: 900,
  minWidth: 520,
  minHeight: 360,
  show: false,
  autoHideMenuBar: true,
  webPreferences: {
    sandbox: false,
  },
  titleBar: {
    enabled: true,
    height: 52,
    color: '#1e1e1e',
    symbolColor: '#ffffff',
    trafficLightPosition: { x: 25, y: 20 },
  },
} as const;

export type MainWindowName = (typeof MainWindowConfig)['name'];
export type MainWindowRoute = (typeof MainWindowConfig)['route'];
