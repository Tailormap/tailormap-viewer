import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimpleSearchComponent } from './simple-search.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { SimpleSearchResultsComponent } from './simple-search-results/simple-search-results.component';

@NgModule({
  declarations: [
    SimpleSearchComponent,
    SimpleSearchResultsComponent,
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
