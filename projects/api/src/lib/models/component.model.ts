import { ComponentBaseConfigModel } from './component-base-config.model';

export interface ComponentModel<ConfigModel extends ComponentBaseConfigModel = ComponentBaseConfigModel> {
    type: string;
    config: ConfigModel;
}
