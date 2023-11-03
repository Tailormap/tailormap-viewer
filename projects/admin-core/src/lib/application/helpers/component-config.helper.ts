import { BaseComponentConfigHelper, ComponentBaseConfigModel } from '@tailormap-viewer/api';

export class ComponentConfigHelper {

  public static getBaseConfig(type: string): ComponentBaseConfigModel {
    return {
      enabled: !BaseComponentConfigHelper.isComponentDisabledByDefault(type),
    };
  }

}
