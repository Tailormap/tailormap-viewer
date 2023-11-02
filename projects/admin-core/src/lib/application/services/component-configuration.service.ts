import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { ComponentBaseConfigModel } from '@tailormap-viewer/api';
import { updateApplicationComponentConfig } from '../state/application.actions';
import { selectComponentsConfigByType } from '../state/application.selectors';
import { take } from 'rxjs';
import { ComponentConfigHelper } from '../helpers/component-config.helper';

@Injectable({
  providedIn: 'root',
})
export class ComponentConfigurationService {

  constructor(
    private store$: Store,
  ) {
  }

  public updateConfig<C extends ComponentBaseConfigModel>(
    type: string | undefined,
    key: keyof C,
    value: string | number | boolean | undefined | null,
  ) {
    if (!type) {
      return;
    }
    this.store$.select(selectComponentsConfigByType(type))
      .pipe(take(1))
      .subscribe(c => {
        const config = c?.config || ComponentConfigHelper.getBaseConfig(type);
        if ((config as C)[key] === value) {
          return;
        }
        this.store$.dispatch(updateApplicationComponentConfig({
          componentType: type,
          config: { ...config, [key]: value },
        }));
      });
  }

}
