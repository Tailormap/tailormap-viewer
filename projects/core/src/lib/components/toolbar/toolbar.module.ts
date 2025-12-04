import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MeasureModule } from './measure/measure.module';
import { GeolocationModule } from './geolocation/geolocation.module';
import { ZoomButtonsModule } from './zoom-buttons/zoom-buttons.module';
import { ClickedCoordinatesModule } from './clicked-coordinates/clicked-coordinates.module';
import { MouseCoordinatesModule } from './mouse-coordinates/mouse-coordinates.module';
import { ScaleBarModule } from './scale-bar/scale-bar.module';
import { SimpleSearchModule } from './simple-search';
import { StreetviewModule } from './streetview/streetview.module';
import { CoordinateLinkWindowModule } from './coordinate-link-window/coordinate-link-window.module';
import { TerrainControlsModule } from './terrain-controls/terrain-controls.module';

@NgModule({
  declarations: [],
  imports: [CommonModule],
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
    TerrainControlsModule,
  ],
})
export class ToolbarModule { }
