import { BaseComponentTypeEnum, ComponentModel } from '../models';

export class BaseComponentConfigHelper {

  public static componentsDisabledByDefault = new Set<string>([
    BaseComponentTypeEnum.EDIT,
    BaseComponentTypeEnum.COORDINATE_LINK_WINDOW,
  ]);

  public static addDefaultDisabledComponent(component: string) {
    BaseComponentConfigHelper.componentsDisabledByDefault.add(component);
  }

  public static isComponentDisabledByDefault(component: string) {
    return BaseComponentConfigHelper.componentsDisabledByDefault.has(component);
  }

  public static isComponentEnabled(config: ComponentModel[], componentType: string) {
    const componentConfig = (config || []).find(c => c.type === componentType);
    if (!componentConfig
      || typeof componentConfig.config === 'undefined'
      || typeof componentConfig.config.enabled === 'undefined') {
      return !BaseComponentConfigHelper.isComponentDisabledByDefault(componentType);
    }
    return componentConfig.config.enabled;
  }

}
