import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { SelectUploadDialogComponent } from './select-upload-dialog/select-upload-dialog.component';
import { SelectUploadComponent } from './select-upload-button/select-upload.component';
import { ImageUploadFieldComponent } from './image-upload-field/image-upload-field.component';

@NgModule({
  declarations: [
    SelectUploadDialogComponent,
    SelectUploadComponent,
    ImageUploadFieldComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
  ],
  exports: [
    SelectUploadDialogComponent,
    SelectUploadComponent,
  ],
})
export class SelectUploadModule {
}
