import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { TriStateBooleanComponent } from './tri-state-boolean/tri-state-boolean.component';
import { PasswordFieldComponent } from './password-field/password-field.component';



@NgModule({
  declarations: [
    TriStateBooleanComponent,
    PasswordFieldComponent,
  ],
  imports: [
    CommonModule,
    SharedImportsModule,
  ],
    exports: [
        TriStateBooleanComponent,
        PasswordFieldComponent,
    ],
})
export class SharedAdminComponentsModule { }
