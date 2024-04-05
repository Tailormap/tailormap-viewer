import { Observable } from 'rxjs';
import { BaseComponentConfigHelper, ComponentModel } from '@tailormap-viewer/api';
import { selectComponentsConfig } from '../state/core.selectors';
import { Store } from '@ngrx/store';
import { Injectable } from '@angular/core';

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

}
