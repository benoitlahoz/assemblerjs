import type { ElectronMenuItem } from '../../model/electron-menu-item';

export type MenuTranslate = (key: string) => string;

export type MenuTranslateHost = {
  translate?: MenuTranslate;
  i18n?: {
    translate?: MenuTranslate;
  };
};

export type { ElectronMenuItem };
