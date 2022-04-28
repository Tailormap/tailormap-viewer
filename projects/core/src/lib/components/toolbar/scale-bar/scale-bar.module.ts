import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScaleBarComponent } from './scale-bar.component';



@NgModule({
  declarations: [
    ScaleBarComponent,
  ],
  imports: [
    CommonModule,
  ],
  exports: [
    ScaleBarComponent,
  ],
})
export class ScaleBarModule { }
