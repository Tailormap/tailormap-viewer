import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { FeatureInfoComponent } from './feature-info/feature-info.component';
import { StoreModule } from '@ngrx/store';
import { featureInfoStateKey } from './state/feature-info.state';
import { featureInfoReducer } from './state/feature-info.reducer';
import { FeatureInfoDialogComponent } from './feature-info-dialog/feature-info-dialog.component';
import { ApplicationMapModule } from '../../map/application-map.module';
import { CoreSharedModule } from '../../shared';
import { CdkAccordion, CdkAccordionItem } from '@angular/cdk/accordion';
import { FeatureInfoLayerListComponent } from './feature-info-layer-list/feature-info-layer-list.component';


@NgModule({
  declarations: [
    FeatureInfoComponent,
    FeatureInfoDialogComponent,
    FeatureInfoLayerListComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    StoreModule.forFeature(featureInfoStateKey, featureInfoReducer),
    ApplicationMapModule,
    CoreSharedModule,
    CdkAccordion,
    CdkAccordionItem,
  ],
  exports: [
    FeatureInfoComponent,
  ],
})
export class FeatureInfoModule { }
