import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormListComponent } from './form-list/form-list.component';
import { FormHomeComponent } from './form-home/form-home.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { StoreModule } from '@ngrx/store';
import { formStateKey } from './state/form.state';
import { formReducer } from './state/form.reducer';
import { EffectsModule } from '@ngrx/effects';
import { FormEffects } from './state/form.effects';
import { FormEditComponent } from './form-edit/form-edit.component';
import { FormCreateComponent } from './form-create/form-create.component';
import { SharedAdminComponentsModule } from '../shared/components/shared-admin-components.module';
import { FormFormComponent } from './form-form/form-form.component';
import { CatalogModule } from '../catalog/catalog.module';
import { FormEditFieldComponent } from './form-edit-field/form-edit-field.component';
import { FormAttributeListComponent } from './form-attribute-list/form-attribute-list.component';
import { FormFieldListComponent } from './form-field-list/form-field-list.component';
import { FormService } from './services/form.service';
import { FormWarningMessageComponent } from './form-warning-message/form-warning-message.component';

@NgModule({
  declarations: [
    FormListComponent,
    FormHomeComponent,
    FormEditComponent,
    FormCreateComponent,
    FormFormComponent,
    FormEditFieldComponent,
    FormAttributeListComponent,
    FormFieldListComponent,
    FormWarningMessageComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    StoreModule.forFeature(formStateKey, formReducer),
    EffectsModule.forFeature([FormEffects]),
    SharedAdminComponentsModule,
    CatalogModule,
  ],
  exports: [
    FormListComponent,
    FormHomeComponent,
    FormEditComponent,
    FormCreateComponent,
    FormWarningMessageComponent,
  ],
})
export class FormModule {
  constructor(formService: FormService) {
    formService.listenForApplicationChanges();
  }
}
