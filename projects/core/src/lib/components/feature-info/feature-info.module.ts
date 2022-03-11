import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { FeatureInfoComponent } from './feature-info/feature-info.component';
import { StoreModule } from '@ngrx/store';
import { featureInfoStateKey } from './state/feature-info.state';
import { featureInfoReducer } from './state/feature-info.reducer';
import { EffectsModule } from '@ngrx/effects';
import { FeatureInfoEffects } from './state/feature-info.effects';
import { FeatureInfoSpinnerComponent } from './feature-info-spinner/feature-info-spinner.component';
import { FeatureInfoDialogComponent } from './feature-info-dialog/feature-info-dialog.component';
import { FeatureInfoHighlightComponent } from './feature-info-highlight/feature-info-highlight.component';


@NgModule({
  declarations: [
    FeatureInfoComponent,
    FeatureInfoSpinnerComponent,
    FeatureInfoDialogComponent,
    FeatureInfoHighlightComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    StoreModule.forFeature(featureInfoStateKey, featureInfoReducer),
    EffectsModule.forFeature([FeatureInfoEffects]),
  ],
  exports: [
    FeatureInfoComponent,
  ],
})
export class FeatureInfoModule { }
