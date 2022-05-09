import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DrawingComponent } from './drawing/drawing.component';
import { DrawingMenuButtonComponent } from './drawing-menu-button/drawing-menu-button.component';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { MenubarModule } from '../menubar';
import { StoreModule } from '@ngrx/store';
import { drawingStateKey } from './state/drawing.state';
import { drawingReducer } from './state/drawing.reducer';

@NgModule({
  declarations: [
    DrawingComponent,
    DrawingMenuButtonComponent,
  ],
  imports: [
    CommonModule,
    SharedImportsModule,
    MenubarModule,
    StoreModule.forFeature(drawingStateKey, drawingReducer),
  ],
  exports: [
    DrawingComponent,
  ],
})
export class DrawingModule {
}
