import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MeasureModule } from './measure/measure.module';
import { ZoomButtonsModule } from './zoom-buttons/zoom-buttons.module';
import { StoreModule } from '@ngrx/store';
import { toolbarStateKey } from './state/toolbar.state';
import { toolbarReducer } from './state/toolbar.reducer';
import { ClickedCoordinatesModule } from './clicked-coordinates/clicked-coordinates.module';
import { EffectsModule } from '@ngrx/effects';
import { ToolbarEffects } from './state/toolbar.effects';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StoreModule.forFeature(toolbarStateKey, toolbarReducer),
    EffectsModule.forFeature([ToolbarEffects]),
    ZoomButtonsModule,
    MeasureModule,
    ClickedCoordinatesModule,
  ],
  exports: [
    ZoomButtonsModule,
    MeasureModule,
    ClickedCoordinatesModule,
  ],
})
export class ToolbarModule { }
