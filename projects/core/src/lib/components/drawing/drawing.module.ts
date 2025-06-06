import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DrawingComponent } from './drawing/drawing.component';
import { DrawingMenuButtonComponent } from './drawing-menu-button/drawing-menu-button.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MenubarModule } from '../menubar';
import { StoreModule } from '@ngrx/store';
import { drawingStateKey } from './state/drawing.state';
import { drawingReducer } from './state/drawing.reducer';
import { DrawingStyleFormComponent } from './drawing-style-form/drawing-style-form.component';
import { ApplicationMapModule } from '../../map/application-map.module';
import { DrawingObjectsListComponent } from './drawing-objects-list/drawing-objects-list.component';
import { DrawingFeatureIconComponent } from './drawing-feature-image/drawing-feature-icon.component';

@NgModule({
  declarations: [
    DrawingComponent,
    DrawingMenuButtonComponent,
    DrawingObjectsListComponent,
    DrawingStyleFormComponent,
    DrawingFeatureIconComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    MenubarModule,
    StoreModule.forFeature(drawingStateKey, drawingReducer),
    ApplicationMapModule,
  ],
  exports: [
    DrawingComponent,
  ],
})
export class DrawingModule {
}
