import { BaseComponentTypeEnum } from '../models';

export class BaseComponentConfigHelper {

  public static componentsDisabledByDefault = new Set([
    BaseComponentTypeEnum.EDIT,
  ]);

  public static isComponentDisabledByDefault(component: BaseComponentTypeEnum) {
    return BaseComponentConfigHelper.componentsDisabledByDefault.has(component);
  }

}
