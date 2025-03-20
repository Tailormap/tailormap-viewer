import { map, Observable } from 'rxjs';
import { BaseComponentConfigHelper, ComponentModel } from '@tailormap-viewer/api';
import { selectComponentsConfig } from '../state/core.selectors';
import { Store } from '@ngrx/store';
import { Injectable } from '@angular/core';
import { setComponentEnabled } from '../state/core.actions';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {

  public componentsConfig$: Observable<ComponentModel[]>;

  constructor(private store$: Store) {
    this.componentsConfig$ = this.store$.select(selectComponentsConfig);
  }

  public isComponentEnabled(config: ComponentModel[], componentType: string) {
    return BaseComponentConfigHelper.isComponentEnabled(config, componentType);
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

}
