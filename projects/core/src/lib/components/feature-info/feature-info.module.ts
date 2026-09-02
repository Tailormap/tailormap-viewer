import { NgModule, inject, provideEnvironmentInitializer } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FeatureInfoComponent } from './feature-info/feature-info.component';
import { provideState, Store } from '@ngrx/store';
import { FeatureInfoDialogComponent } from './feature-info-dialog/feature-info-dialog.component';
import { ApplicationMapModule } from '../../map/application-map.module';

import { CdkAccordion, CdkAccordionItem } from '@angular/cdk/accordion';
import { FeatureInfoLayerListComponent } from './feature-info-layer-list/feature-info-layer-list.component';
import { FeatureInfoLayerItemComponent } from './feature-info-layer-item/feature-info-layer-item.component';
import { FeatureInfoLayerDropdownComponent } from './feature-info-layer-dropdown/feature-info-layer-dropdown.component';
import { BaseComponentTypeEnum, FeatureInfoConfigModel } from '@tailormap-viewer/api';
import { ComponentConfigHelper } from '../../shared/helpers/component-config.helper';
import { expandCollapseFeatureInfoLayerList } from './state/feature-info.actions';
import { FeatureInfoTemplateRendererComponent } from './feature-info-template-renderer/feature-info-template-renderer.component';
import { FeatureInfoContentComponent } from './feature-info-content/feature-info-content.component';
import { featureInfoReducer } from './state/feature-info.reducer';
import { featureInfoStateKey } from './state/feature-info.state';


@NgModule({
    imports: [
    CommonModule,
    ApplicationMapModule,
    CdkAccordion,
    CdkAccordionItem,
    FeatureInfoTemplateRendererComponent,
    FeatureInfoComponent,
    FeatureInfoDialogComponent,
    FeatureInfoLayerListComponent,
    FeatureInfoLayerItemComponent,
    FeatureInfoLayerDropdownComponent,
    FeatureInfoContentComponent,
],
    exports: [
        FeatureInfoComponent,
        FeatureInfoDialogComponent,
    ],
    providers: [
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
    ],
})
export class FeatureInfoModule {
}
