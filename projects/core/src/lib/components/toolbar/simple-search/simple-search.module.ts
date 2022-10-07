import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimpleSearchComponent } from './simple-search.component';
import { SharedModule } from '@tailormap-viewer/shared';

@NgModule({
  declarations: [
    SimpleSearchComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
  ],
  exports: [
    SimpleSearchComponent,
  ],
})
export class SimpleSearchModule { }
