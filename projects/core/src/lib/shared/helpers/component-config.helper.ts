import { LoadingStateEnum, RegisteredComponent } from '@tailormap-viewer/shared';
import { BaseComponentConfigHelper, BaseComponentTypeEnum, ComponentBaseConfigModel, ComponentModel } from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';
import { selectComponentsConfigForType, selectViewerLoadingState } from '../../state/core.selectors';
import { filter, switchMap, take } from 'rxjs';

export class ComponentConfigHelper {

  public static filterDisabledComponents(
    components: RegisteredComponent[],
    config: ComponentModel[],
  ): RegisteredComponent[] {
    return components.filter(c => BaseComponentConfigHelper.isComponentEnabled(config, c.type));
  }

  public static useInitialConfigForComponent<ConfigType extends ComponentBaseConfigModel = ComponentBaseConfigModel>(
    store$: Store,
    type: string | BaseComponentTypeEnum,
    callback: (config: ConfigType) => void,
  ) {
    return store$.select(selectViewerLoadingState)
      .pipe(
        filter(loadState => loadState === LoadingStateEnum.LOADED || loadState === LoadingStateEnum.FAILED),
        take(1),
        switchMap(() => store$.select(selectComponentsConfigForType<ConfigType>(type)).pipe(take(1))),
      )
      .subscribe(config => {
        if (config) {
          callback(config.config);
        }
      });
  }

}
