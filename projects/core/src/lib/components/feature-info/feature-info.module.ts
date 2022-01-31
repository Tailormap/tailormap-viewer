import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { FeatureInfoComponent } from './feature-info/feature-info.component';
import { StoreModule } from '@ngrx/store';
import { featureInfoStateKey } from './state/feature-info.state';
import { featureInfoReducer } from './state/feature-info.reducer';
import { EffectsModule } from '@ngrx/effects';
import { FeatureInfoEffects } from './state/feature-info.effects';
import { FeatureInfoSpinnerComponent } from './feature-info-spinner/feature-info-spinner.component';


@NgModule({
  declarations: [
    FeatureInfoComponent,
    FeatureInfoSpinnerComponent,
  ],
  imports: [
    CommonModule,
    SharedImportsModule,
    StoreModule.forFeature(featureInfoStateKey, featureInfoReducer),
    EffectsModule.forFeature([FeatureInfoEffects]),
  ],
  exports: [
    FeatureInfoComponent,
  ],
})
export class FeatureInfoModule { }
