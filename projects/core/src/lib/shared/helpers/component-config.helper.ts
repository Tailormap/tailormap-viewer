import { RegisteredComponent } from '@tailormap-viewer/shared';
import { BaseComponentConfigHelper, ComponentModel } from '@tailormap-viewer/api';

export class ComponentConfigHelper {

  public static filterDisabledComponents(
    components: RegisteredComponent[],
    config: ComponentModel[],
  ): RegisteredComponent[] {
    return components.filter(c => BaseComponentConfigHelper.isComponentEnabled(config, c.type));
  }

}
