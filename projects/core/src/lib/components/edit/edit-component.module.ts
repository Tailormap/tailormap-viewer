import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { EditFormComponent } from './edit-form/edit-form.component';
import { EditComponent } from './edit/edit.component';
import { StoreModule } from '@ngrx/store';
import { editStateKey } from './state/edit.state';
import { editReducer } from './state/edit.reducer';
import { EditToolComponent } from './edit-tool/edit-tool.component';
import { EffectsModule } from '@ngrx/effects';
import { EditEffects } from './state/edit.effects';
import { EditDialogComponent } from './edit-dialog/edit-dialog.component';
import { ApplicationMapModule } from '../../map/application-map.module';
import { EditSelectFeatureComponent } from './edit-select-feature/edit-select-feature.component';
import { EditGeometryToolComponent } from './edit-geometry-tool/edit-geometry-tool.component';


@NgModule({
  declarations: [
    EditFormComponent,
    EditComponent,
    EditToolComponent,
    EditDialogComponent,
    EditSelectFeatureComponent,
    EditGeometryToolComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    StoreModule.forFeature(editStateKey, editReducer),
    EffectsModule.forFeature([EditEffects]),
    ApplicationMapModule,
  ],
    exports: [
        EditComponent,
        EditDialogComponent,
    ],
})
export class EditComponentModule {
}
