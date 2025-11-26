import { LoadingStateEnum, RegisteredComponent } from '@tailormap-viewer/shared';
import { BaseComponentConfigHelper, BaseComponentTypeEnum, ComponentBaseConfigModel, ComponentModel } from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';
import { selectComponentsConfigForType, selectViewerLoadingState } from '../../state/core.selectors';
import { filter, map, switchMap, take } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

export class ComponentConfigHelper {

  public static filterDisabledComponents(
    components: RegisteredComponent[],
    config: ComponentModel[],
  ): RegisteredComponent[] {
    return components.filter(c => BaseComponentConfigHelper.isComponentEnabled(config, c.type));
  }

  public static componentConfig$<ConfigType extends ComponentBaseConfigModel = ComponentBaseConfigModel>(
    store$: Store,
    type: string | BaseComponentTypeEnum,
  ) {
    return store$.select(selectViewerLoadingState)
      .pipe(
        filter(loadState => loadState === LoadingStateEnum.LOADED),
        switchMap(() => store$.select(selectComponentsConfigForType<ConfigType>(type)).pipe(take(1))),
        map((config): ConfigType => {
          const enabled = BaseComponentConfigHelper.isComponentEnabled(config ? [config] : [], type);
          if (config) {
            return { ...config.config, enabled };
          }
          return { enabled } as ConfigType;
        }),
      );
  }

  public static useInitialConfigForComponent<ConfigType extends ComponentBaseConfigModel = ComponentBaseConfigModel>(
    store$: Store,
    type: string | BaseComponentTypeEnum,
    callback: (config: ConfigType) => void,
  ) {
    ComponentConfigHelper.componentConfig$<ConfigType>(store$, type)
      .pipe(take(1))
      .subscribe(config => {
        callback(config);
      });
  }

  public static componentConfigSignal<ConfigType extends ComponentBaseConfigModel = ComponentBaseConfigModel>(
    store$: Store,
    type: string | BaseComponentTypeEnum) {
    return toSignal(ComponentConfigHelper.componentConfig$<ConfigType>(store$, type));
  }

  public static componentEnabledConfigSignal(
    store$: Store,
    type: string | BaseComponentTypeEnum) {
    return toSignal(ComponentConfigHelper.componentConfig$(store$, type).pipe(map(config => config.enabled)), { initialValue: false });
  }
}
