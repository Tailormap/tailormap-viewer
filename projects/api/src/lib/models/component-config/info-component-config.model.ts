import { ComponentBaseConfigModel } from '../component-base-config.model';

export interface InfoComponentConfigModel extends ComponentBaseConfigModel {
  openOnStartup: boolean;
  templateContent?: string;
}
