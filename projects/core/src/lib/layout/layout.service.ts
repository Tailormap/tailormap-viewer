import { map, Observable, combineLatest } from 'rxjs';
import { BaseComponentConfigHelper, BaseComponentTypeEnum, ComponentModel } from '@tailormap-viewer/api';
import { selectComponentsConfig } from '../state/core.selectors';
import { Store } from '@ngrx/store';
import { Injectable } from '@angular/core';
import { selectIn3DView } from '../map/state/map.selectors';
import { setComponentEnabled } from '../state/core.actions';

export interface LayoutConfig {
  config: ComponentModel[];
  in3D: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class LayoutService {

  public componentsConfig$: Observable<LayoutConfig>;

  private disallowingComponents = [
    BaseComponentTypeEnum.PRINT,
    BaseComponentTypeEnum.DRAWING,
    BaseComponentTypeEnum.MEASURE,
    BaseComponentTypeEnum.MOUSE_COORDINATES,
    BaseComponentTypeEnum.SCALE_BAR,
  ];

  private componentsOnlyIn3D = [
    BaseComponentTypeEnum.TERRAIN_LAYER_TOGGLE,
  ];

  constructor(private store$: Store) {
    this.componentsConfig$ = combineLatest([
      store$.select(selectComponentsConfig),
      store$.select(selectIn3DView),
    ]).pipe(
      map(([ components, in3DView ]) => {
        return { config: components, in3D: in3DView };
      }),
    );
  }

  public enableComponent(componentType: string) {
    this.store$.dispatch(setComponentEnabled({ componentType, enabled: true }));
  }

  public disableComponent(componentType: string) {
    this.store$.dispatch(setComponentEnabled({ componentType, enabled: false }));
  }

  public isComponentEnabled$(componentType: string) {
    return this.componentsConfig$.pipe(
      map(config => BaseComponentConfigHelper.isComponentEnabled(config, componentType)),
    );
  }

  public isComponentEnabled(layoutConfig: LayoutConfig, componentType: string) {
    if (layoutConfig.in3D) {
      if (this.disallowingComponents.some(disallowingComponent => disallowingComponent === componentType)) {
        return false;
      }
    } else {
      if (this.componentsOnlyIn3D.some(componentOnlyIn3D => componentOnlyIn3D === componentType)) {
        return false;
      }
    }
    return BaseComponentConfigHelper.isComponentEnabled(layoutConfig.config, componentType);
  }

}
