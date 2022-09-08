import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DrawingComponent } from './drawing/drawing.component';
import { DrawingMenuButtonComponent } from './drawing-menu-button/drawing-menu-button.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MenubarModule } from '../menubar';
import { StoreModule } from '@ngrx/store';
import { drawingStateKey } from './state/drawing.state';
import { drawingReducer } from './state/drawing.reducer';
import { CreateDrawingButtonComponent } from './create-drawing-button/create-drawing-button.component';
import { DrawingStyleFormComponent } from './drawing-style-form/drawing-style-form.component';

@NgModule({
  declarations: [
    DrawingComponent,
    DrawingMenuButtonComponent,
    CreateDrawingButtonComponent,
    DrawingStyleFormComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    MenubarModule,
    StoreModule.forFeature(drawingStateKey, drawingReducer),
  ],
  exports: [
    DrawingComponent,
  ],
})
export class DrawingModule {
}
