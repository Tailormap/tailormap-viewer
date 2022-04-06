import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { mapStateKey } from './state/map.state';
import { mapReducer } from './state/map.reducer';
import { EffectsModule } from '@ngrx/effects';
import { MapEffects } from './state/map.effects';
import { ApplicationMapService } from './services/application-map.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StoreModule.forFeature(mapStateKey, mapReducer),
    EffectsModule.forFeature([MapEffects]),
  ],
})
export class ApplicationMapModule {
  constructor(_applicationMapService: ApplicationMapService) {}
}
