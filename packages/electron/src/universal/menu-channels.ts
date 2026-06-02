export const buildMenuCommandChannel = (
  windowName: string,
  command: string,
): string => {
  return `menu:${windowName}.${command}`;
};

export const buildMenuEventChannel = (
  windowName: string,
  event: string,
): string => {
  return `menu:${windowName}.${event}`;
};
