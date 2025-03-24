import { map, Observable, combineLatest } from 'rxjs';
import { BaseComponentConfigHelper, BaseComponentTypeEnum, ComponentModel } from '@tailormap-viewer/api';
import { selectComponentsConfig } from '../state/core.selectors';
import { Store } from '@ngrx/store';
import { Injectable } from '@angular/core';
import { selectIn3dView } from '../map/state/map.selectors';
import { setComponentEnabled } from '../state/core.actions';

export interface LayoutConfig {
  config: ComponentModel[];
  in3d: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class LayoutService {

  public componentsConfig$: Observable<LayoutConfig>;

  private componentsNotIn3d = [
    BaseComponentTypeEnum.PRINT,
    BaseComponentTypeEnum.DRAWING,
    BaseComponentTypeEnum.MEASURE,
    BaseComponentTypeEnum.MOUSE_COORDINATES,
    BaseComponentTypeEnum.SCALE_BAR,
  ];

  private componentsOnlyIn3d = [
    BaseComponentTypeEnum.TERRAIN_LAYER_TOGGLE,
  ];

  constructor(private store$: Store) {
    this.componentsConfig$ = combineLatest([
      store$.select(selectComponentsConfig),
      store$.select(selectIn3dView),
    ]).pipe(
      map(([ components, in3dView ]) => {
        return { config: components, in3d: in3dView };
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
      map(config => this.isComponentEnabled(config, componentType)),
    );
  }

  public isComponentEnabled(layoutConfig: LayoutConfig, componentType: string) {
    if (
      // If in 3d, disable components not usable in 3d
      (layoutConfig.in3d && this.componentsNotIn3d.some(disallowingComponent => disallowingComponent === componentType))
      // If not in 3d, disable components only usable in 3d
      || (!layoutConfig.in3d && this.componentsOnlyIn3d.some(componentOnlyIn3D => componentOnlyIn3D === componentType))
    ) {
      return false;
    }
    return BaseComponentConfigHelper.isComponentEnabled(layoutConfig.config, componentType);
  }

}
