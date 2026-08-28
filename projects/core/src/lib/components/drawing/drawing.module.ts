import { NgModule } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { DrawingComponent } from './drawing/drawing.component';
import { DrawingMenuButtonComponent } from './drawing-menu-button/drawing-menu-button.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MenubarModule } from '../menubar';
import { DrawingStyleFormComponent } from './drawing-style-form/drawing-style-form.component';
import { ApplicationMapModule } from '../../map/application-map.module';
import { DrawingObjectsListComponent } from './drawing-objects-list/drawing-objects-list.component';
import { DrawingStyleIconComponent } from '../../map';
import { provideState } from '@ngrx/store';
import { drawingReducer } from './state/drawing.reducer';
import { drawingStateKey } from './state';

@NgModule({
  declarations: [
    DrawingComponent,
    DrawingMenuButtonComponent,
    DrawingObjectsListComponent,
    DrawingStyleFormComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    MenubarModule,
    ApplicationMapModule,
    NgOptimizedImage,
    DrawingStyleIconComponent,
  ],
  exports: [
    DrawingComponent,
  ],
  providers: [
    provideState(drawingStateKey, drawingReducer),
  ],
})
export class DrawingModule {
}
