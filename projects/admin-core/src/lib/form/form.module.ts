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

@NgModule({
  declarations: [
    FormListComponent,
    FormHomeComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    StoreModule.forFeature(formStateKey, formReducer),
    EffectsModule.forFeature([FormEffects]),
  ],
  exports: [
    FormListComponent,
    FormHomeComponent,
  ],
})
export class FormModule { }
