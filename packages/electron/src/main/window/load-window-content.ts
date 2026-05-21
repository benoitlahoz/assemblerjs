export interface WindowContentTarget {
  loadURL(url: string): Promise<unknown>;
  loadFile(
    filePath: string,
    options?: {
      hash?: string;
    },
  ): Promise<unknown>;
}

export interface WindowContentLoader {
  devUrl?: string;
  file: string;
  route?: string;
}

export async function loadWindowContent(
  window: WindowContentTarget,
  options: WindowContentLoader,
): Promise<void> {
  const { devUrl, file, route = '/' } = options;

  if (devUrl) {
    await window.loadURL(`${devUrl}#${route}`);
    return;
  }

  await window.loadFile(file, {
    hash: route,
  });
}
