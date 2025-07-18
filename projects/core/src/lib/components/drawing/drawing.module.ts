import { NgModule } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
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
import { DrawingStyleIconComponent } from './drawing-style-icon/drawing-style-icon.component';
import { DrawingStyleLibraryListComponent } from './drawing-style-library-list/drawing-style-library-list.component';

@NgModule({
  declarations: [
    DrawingComponent,
    DrawingMenuButtonComponent,
    DrawingObjectsListComponent,
    DrawingStyleFormComponent,
    DrawingStyleIconComponent,
    DrawingStyleLibraryListComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    MenubarModule,
    StoreModule.forFeature(drawingStateKey, drawingReducer),
    ApplicationMapModule,
    NgOptimizedImage,
  ],
  exports: [
    DrawingComponent,
  ],
})
export class DrawingModule {
}
