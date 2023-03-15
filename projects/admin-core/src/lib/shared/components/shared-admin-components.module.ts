import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { TriStateBooleanComponent } from './tri-state-boolean/tri-state-boolean.component';



@NgModule({
  declarations: [
    TriStateBooleanComponent,
  ],
  imports: [
    CommonModule,
    SharedImportsModule,
  ],
  exports: [
    TriStateBooleanComponent,
  ],
})
export class SharedAdminComponentsModule { }
