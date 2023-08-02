import { BaseComponentConfigHelper, BaseComponentTypeEnum, ComponentBaseConfigModel } from '@tailormap-viewer/api';

export class ComponentConfigHelper {

  public static getBaseConfig(type: BaseComponentTypeEnum): ComponentBaseConfigModel {
    const defaultDisabled = BaseComponentConfigHelper.isComponentsDisabledByDefault(type);
    return {
      enabled: !defaultDisabled,
    };
  }

}
