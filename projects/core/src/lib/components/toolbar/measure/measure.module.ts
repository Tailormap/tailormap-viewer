import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MeasureComponent } from './measure.component';
import { SharedImportsModule } from '@tailormap-viewer/shared';

@NgModule({
  declarations: [
    MeasureComponent,
  ],
  imports: [
    CommonModule,
    SharedImportsModule,
  ],
  exports: [
    MeasureComponent,
  ],
})
export class MeasureModule { }
