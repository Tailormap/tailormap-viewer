import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { EditFormComponent } from './edit-form/edit-form.component';
import { EditComponent } from './edit/edit.component';
import { StoreModule } from '@ngrx/store';
import { editStateKey } from './state/edit.state';
import { editReducer } from './state/edit.reducer';
import { EditToolComponent } from './edit-tool/edit-tool.component';


@NgModule({
  declarations: [
    EditFormComponent,
    EditComponent,
    EditToolComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    StoreModule.forFeature(editStateKey, editReducer),
  ],
  exports: [
    EditComponent,
  ],
})
export class EditComponentModule {
}
