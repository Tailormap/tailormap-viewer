import { ComponentBaseConfigModel } from '@tailormap-viewer/api';

export class ComponentConfigHelper {

  public static getBaseConfig(): ComponentBaseConfigModel {
    return {
      enabled: true,
    };
  }

}
