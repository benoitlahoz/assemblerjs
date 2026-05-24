export const buildWindowCommandChannel = (
  windowName: string,
  command: string,
): string => {
  return `window:${windowName}.${command}`;
};

export const buildWindowEventChannel = (
  windowName: string,
  event: string,
): string => {
  if (event.includes(':')) {
    return event;
  }

  return `window:${windowName}.${event}`;
};
