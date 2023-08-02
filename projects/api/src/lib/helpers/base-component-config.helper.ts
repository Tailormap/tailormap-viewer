import { BaseComponentTypeEnum } from '../models';

export class BaseComponentConfigHelper {

  private static componentsDisabledByDefault = new Set([
    BaseComponentTypeEnum.EDIT,
  ]);

  public static isComponentsDisabledByDefault(component: BaseComponentTypeEnum) {
    return BaseComponentConfigHelper.componentsDisabledByDefault.has(component);
  }

}
