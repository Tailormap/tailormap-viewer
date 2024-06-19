import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedDirectivesModule, SharedImportsModule } from '@tailormap-viewer/shared';
import { TriStateBooleanComponent } from './tri-state-boolean/tri-state-boolean.component';
import { PasswordFieldComponent } from './password-field/password-field.component';
import { SaveButtonComponent } from './save-button/save-button.component';
import { BoundsFieldComponent } from './bounds-field/bounds-field.component';
import { AuthorizationEditComponent } from './authorization-edit/authorization-edit.component';
import { AdminFieldsRendererComponent } from './admin-fields-renderer/admin-fields-renderer.component';
import { UpdateFeatureTypeButtonComponent } from './update-feature-type-button/update-feature-type-button.component';
import { SelectUploadModule } from './select-upload/select-upload.module';
import { SpinnerButtonComponent } from './spinner-button/spinner-button.component';

@NgModule({
  declarations: [
    TriStateBooleanComponent,
    PasswordFieldComponent,
    SaveButtonComponent,
    BoundsFieldComponent,
    AuthorizationEditComponent,
    AdminFieldsRendererComponent,
    UpdateFeatureTypeButtonComponent,
    SpinnerButtonComponent,
  ],
  imports: [
    CommonModule,
    SharedImportsModule,
    SharedDirectivesModule,
  ],
  exports: [
    TriStateBooleanComponent,
    PasswordFieldComponent,
    SaveButtonComponent,
    BoundsFieldComponent,
    AuthorizationEditComponent,
    AdminFieldsRendererComponent,
    SelectUploadModule,
    SpinnerButtonComponent,
  ],
})
export class SharedAdminComponentsModule {
}
