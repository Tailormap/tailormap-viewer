import { ComponentBaseConfig } from './component-base-config.model';

export interface Component {
    type: string;
    config: ComponentBaseConfig;
}
