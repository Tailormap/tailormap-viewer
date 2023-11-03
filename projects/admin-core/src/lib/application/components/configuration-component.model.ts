import { BaseComponentTypeEnum, ComponentBaseConfigModel } from '@tailormap-viewer/api';

export interface ConfigurationComponentModel<C extends ComponentBaseConfigModel = ComponentBaseConfigModel> {
  type: BaseComponentTypeEnum | undefined;
  label: string | undefined;
  config: C | undefined;
}
