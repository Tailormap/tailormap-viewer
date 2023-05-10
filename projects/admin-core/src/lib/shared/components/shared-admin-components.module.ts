import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { TriStateBooleanComponent } from './tri-state-boolean/tri-state-boolean.component';
import { PasswordFieldComponent } from './password-field/password-field.component';
import { SaveButtonComponent } from './save-button/save-button.component';
import { BoundsFieldComponent } from './bounds-field/bounds-field.component';
import { AuthorizationEditComponent } from './authorization-edit/authorization-edit.component';

@NgModule({
  declarations: [
    TriStateBooleanComponent,
    PasswordFieldComponent,
    SaveButtonComponent,
    BoundsFieldComponent,
    AuthorizationEditComponent,
  ],
  imports: [
    CommonModule,
    SharedImportsModule,
  ],
  exports: [
    TriStateBooleanComponent,
    PasswordFieldComponent,
    SaveButtonComponent,
    BoundsFieldComponent,
    AuthorizationEditComponent,
  ],
})
export class SharedAdminComponentsModule {
}
