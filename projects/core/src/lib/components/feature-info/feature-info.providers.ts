import { EnvironmentProviders, inject, Provider, provideEnvironmentInitializer } from '@angular/core';
import { provideState, Store } from '@ngrx/store';
import { BaseComponentTypeEnum, FeatureInfoConfigModel } from '@tailormap-viewer/api';
import { ComponentConfigHelper } from '../../shared/helpers/component-config.helper';
import { expandCollapseFeatureInfoLayerList } from './state/feature-info.actions';
import { featureInfoReducer } from './state/feature-info.reducer';
import { featureInfoStateKey } from './state/feature-info.state';

export function provideFeatureInfo(): Array<Provider | EnvironmentProviders> {
  return [
    provideState(featureInfoStateKey, featureInfoReducer),
    // Must run after `provideState` above since it selects/dispatches `featureInfoStateKey` state.
    provideEnvironmentInitializer(() => {
      const store$ = inject(Store);
      ComponentConfigHelper.useInitialConfigForComponent<FeatureInfoConfigModel>(store$, BaseComponentTypeEnum.FEATURE_INFO, config => {
        if (config.defaultShowDropdown) {
          store$.dispatch(expandCollapseFeatureInfoLayerList());
        }
      });
    }),
  ];
}
