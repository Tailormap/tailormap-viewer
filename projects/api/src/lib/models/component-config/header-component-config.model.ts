import { ComponentBaseConfigModel } from '../component-base-config.model';

export interface HeaderMenuItemModel {
  id: string;
  label: string;
  url: string;
}

export interface HeaderComponentConfigModel extends ComponentBaseConfigModel {
  height: number;
  backgroundColor?: string;
  textColor?: string;
  logoFileId?: string;
  css?: string;
  menuItems?: HeaderMenuItemModel[];
}
