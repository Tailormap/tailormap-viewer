import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MeasureModule } from './measure/measure.module';
import { GeolocationModule } from './geolocation/geolocation.module';
import { ZoomButtonsModule } from './zoom-buttons/zoom-buttons.module';
import { StoreModule } from '@ngrx/store';
import { toolbarStateKey } from './state/toolbar.state';
import { toolbarReducer } from './state/toolbar.reducer';
import { ClickedCoordinatesModule } from './clicked-coordinates/clicked-coordinates.module';
import { EffectsModule } from '@ngrx/effects';
import { ToolbarEffects } from './state/toolbar.effects';
import { MouseCoordinatesModule } from './mouse-coordinates/mouse-coordinates.module';
import { ScaleBarModule } from './scale-bar/scale-bar.module';
import { SimpleSearchModule } from './simple-search';
import { StreetviewModule } from './streetview/streetview.module';
import { CoordinateLinkWindowModule } from './coordinate-link-window/coordinate-link-window.module';
import { TerrainLayerToggleModule } from './terrain-layer-toggle/terrain-layer-toggle.module';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StoreModule.forFeature(toolbarStateKey, toolbarReducer),
    EffectsModule.forFeature([ToolbarEffects]),
  ],
  exports: [
    ZoomButtonsModule,
    MeasureModule,
    ClickedCoordinatesModule,
    MouseCoordinatesModule,
    ScaleBarModule,
    SimpleSearchModule,
    GeolocationModule,
    StreetviewModule,
    CoordinateLinkWindowModule,
    TerrainLayerToggleModule,
  ],
})
export class ToolbarModule { }
