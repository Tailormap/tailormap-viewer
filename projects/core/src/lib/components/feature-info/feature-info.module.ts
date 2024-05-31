import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { FeatureInfoComponent } from './feature-info/feature-info.component';
import { StoreModule } from '@ngrx/store';
import { featureInfoStateKey } from './state/feature-info.state';
import { featureInfoReducer } from './state/feature-info.reducer';
import { EffectsModule } from '@ngrx/effects';
import { FeatureInfoEffects } from './state/feature-info.effects';
import { FeatureInfoDialogComponent } from './feature-info-dialog/feature-info-dialog.component';
import { ApplicationMapModule } from '../../map/application-map.module';
import { CoreSharedModule } from '../../shared';


@NgModule({
  declarations: [
    FeatureInfoComponent,
    FeatureInfoDialogComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    StoreModule.forFeature(featureInfoStateKey, featureInfoReducer),
    EffectsModule.forFeature([FeatureInfoEffects]),
    ApplicationMapModule,
    CoreSharedModule,
  ],
  exports: [
    FeatureInfoComponent,
  ],
})
export class FeatureInfoModule { }
