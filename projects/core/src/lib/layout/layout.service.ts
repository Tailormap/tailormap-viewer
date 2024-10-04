import { map, Observable, combineLatest } from 'rxjs';
import { BaseComponentConfigHelper, BaseComponentTypeEnum, ComponentModel } from '@tailormap-viewer/api';
import { selectComponentsConfig } from '../state/core.selectors';
import { Store } from '@ngrx/store';
import { Injectable } from '@angular/core';
import { selectIn3DView } from '../map/state/map.selectors';

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
    BaseComponentTypeEnum.COORDINATE_LINK_WINDOW,
    BaseComponentTypeEnum.MEASURE,
    BaseComponentTypeEnum.COORDINATE_PICKER,
    BaseComponentTypeEnum.STREETVIEW,
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

  public isComponentEnabled(layoutConfig: LayoutConfig, componentType: string) {
    if (layoutConfig.in3D) {
      if (this.disallowingComponents.some(disallowingComponent => disallowingComponent === componentType)) {
        return false;
      }
    }
    return BaseComponentConfigHelper.isComponentEnabled(layoutConfig.config, componentType);
  }

}
