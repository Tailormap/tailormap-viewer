import { Injectable, inject } from '@angular/core';
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
  private store$ = inject(Store);


  public updateConfigForKey<C extends ComponentBaseConfigModel>(
    type: string | undefined,
    key: keyof C,
    value: any,
  ) {
    this.updateConfig<C>(type, { [key]: value } as Partial<C>); // Cast to Partial<C> to satisfy TypeScript, key is guaranteed to be a key of C
  }

  public updateConfig<C extends ComponentBaseConfigModel>(type: string | undefined, value: Partial<C>) {
    if (!type) {
      return;
    }
    this.store$.select(selectComponentsConfigByType(type))
      .pipe(take(1))
      .subscribe(c => {
        const config = c?.config || ComponentConfigHelper.getBaseConfig(type);
        const keys = Object.keys(value) as (keyof C)[]; // Ensure keys are of type keyof C - no other way to make TS happy
        if (keys.length === 0 || keys.every(k => value[k] === (config as C)[k])) {
          return;
        }
        this.store$.dispatch(updateApplicationComponentConfig({
          componentType: type,
          config: { ...config, ...value },
        }));
      });
  }

}
