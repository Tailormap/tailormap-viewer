import { NgModule, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { FeatureInfoComponent } from './feature-info/feature-info.component';
import { Store, StoreModule } from '@ngrx/store';
import { featureInfoStateKey } from './state/feature-info.state';
import { featureInfoReducer } from './state/feature-info.reducer';
import { FeatureInfoDialogComponent } from './feature-info-dialog/feature-info-dialog.component';
import { ApplicationMapModule } from '../../map/application-map.module';
import { CoreSharedModule } from '../../shared';
import { CdkAccordion, CdkAccordionItem } from '@angular/cdk/accordion';
import { FeatureInfoLayerListComponent } from './feature-info-layer-list/feature-info-layer-list.component';
import { FeatureInfoLayerItemComponent } from './feature-info-layer-item/feature-info-layer-item.component';
import { FeatureInfoLayerDropdownComponent } from './feature-info-layer-dropdown/feature-info-layer-dropdown.component';
import { BaseComponentTypeEnum, FeatureInfoConfigModel } from '@tailormap-viewer/api';
import { ComponentConfigHelper } from '../../shared/helpers/component-config.helper';
import { expandCollapseFeatureInfoLayerList } from './state/feature-info.actions';
import { FeatureInfoTemplateRendererComponent } from './feature-info-template-renderer/feature-info-template-renderer.component';


@NgModule({
  declarations: [
    FeatureInfoComponent,
    FeatureInfoDialogComponent,
    FeatureInfoLayerListComponent,
    FeatureInfoLayerItemComponent,
    FeatureInfoLayerDropdownComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    StoreModule.forFeature(featureInfoStateKey, featureInfoReducer),
    ApplicationMapModule,
    CoreSharedModule,
    CdkAccordion,
    CdkAccordionItem,
    FeatureInfoTemplateRendererComponent,
  ],
  exports: [
    FeatureInfoComponent,
  ],
})
export class FeatureInfoModule {
  constructor() {
    const store$ = inject(Store);

    ComponentConfigHelper.useInitialConfigForComponent<FeatureInfoConfigModel>(
      store$,
      BaseComponentTypeEnum.FEATURE_INFO,
      config => {
        if (config.defaultShowDropdown) {
          store$.dispatch(expandCollapseFeatureInfoLayerList());
        }
      },
    );
  }
}
