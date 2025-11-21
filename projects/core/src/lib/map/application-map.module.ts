import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { mapStateKey } from './state/map.state';
import { mapReducer } from './state/map.reducer';
import { EffectsModule } from '@ngrx/effects';
import { MapEffects } from './state/map.effects';
import { ApplicationMapService } from './services/application-map.service';
import { SharedModule } from '@tailormap-viewer/shared';
import { MapSpinnerComponent } from './components/map-spinner/map-spinner.component';

@NgModule({
  declarations: [
    MapSpinnerComponent,
  ],
  imports: [
    CommonModule,
    StoreModule.forFeature(mapStateKey, mapReducer),
    EffectsModule.forFeature([MapEffects]),
    SharedModule,
  ],
  exports: [
    MapSpinnerComponent,
  ],
})
export class ApplicationMapModule {
  //eslint-disable-next-line @angular-eslint/prefer-inject
  constructor(_applicationMapService: ApplicationMapService) { /* constructor is used to initialize the service */ }
}
